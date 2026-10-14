import {
  ContractAssertion,
  ContractAssertionResult,
  ContractTestCase,
  ContractTestCaseResult,
  ContractTestReport,
  ContractTestSuite
} from '../../../shared/types'

/**
 * Resolves a dot or bracket-notated property path from an object.
 * e.g. "content[0].text" or "result.items.0.name"
 */
export function getNestedProperty(obj: any, pathStr?: string): any {
  if (!obj || !pathStr) return obj
  // Normalize bracket notation: content[0].text -> content.0.text
  const normalizedPath = pathStr.replace(/\[(\d+)\]/g, '.$1').replace(/^\./, '')
  const parts = normalizedPath.split('.')

  let current = obj
  for (const part of parts) {
    if (current === undefined || current === null) return undefined
    current = current[part]
  }
  return current
}

/**
 * Evaluates a single assertion rule against the execution response.
 */
export function evaluateAssertion(
  assertion: ContractAssertion,
  response: any,
  durationMs: number
): ContractAssertionResult {
  try {
    switch (assertion.type) {
      case 'status_success': {
        const isError =
          response?.isError === true ||
          Boolean(response?.error) ||
          response?.result?.isError === true
        const passed = !isError
        return {
          assertion,
          passed,
          actualValue: isError ? 'error' : 'success',
          message: passed
            ? 'Execution succeeded with valid response status'
            : `Tool reported error: ${response?.error?.message || response?.error || 'Unknown error'}`
        }
      }

      case 'duration_lt': {
        const limit = assertion.toleranceMs ?? assertion.expectedValue ?? 1000
        const passed = durationMs <= limit
        return {
          assertion,
          passed,
          actualValue: `${durationMs}ms`,
          message: passed
            ? `Execution took ${durationMs}ms (<= ${limit}ms limit)`
            : `Latency threshold exceeded: took ${durationMs}ms (expected <= ${limit}ms)`
        }
      }

      case 'schema_valid': {
        const payload = response?.result ?? response
        // Validate that response contains structured content array or non-null object
        const isValid =
          payload &&
          typeof payload === 'object' &&
          (Array.isArray(payload.content) || Object.keys(payload).length > 0)
        return {
          assertion,
          passed: Boolean(isValid),
          actualValue: typeof payload,
          message: isValid
            ? 'Response conforms to standard MCP payload schema'
            : 'Response payload is missing or not a valid object schema'
        }
      }

      case 'json_path_equals': {
        let actualValue = getNestedProperty(response, assertion.path)
        if (actualValue === undefined) {
          const payload = response?.result ?? response
          actualValue = getNestedProperty(payload, assertion.path)
        }
        if (actualValue === undefined && assertion.path?.startsWith('result.')) {
          actualValue = getNestedProperty(response?.result, assertion.path.slice(7))
        }
        const expected = assertion.expectedValue
        const passed = JSON.stringify(actualValue) === JSON.stringify(expected)
        return {
          assertion,
          passed,
          actualValue,
          message: passed
            ? `Property "${assertion.path}" matched expected value`
            : `Expected "${assertion.path}" to equal ${JSON.stringify(expected)}, got ${JSON.stringify(actualValue)}`
        }
      }

      case 'contains_text': {
        const payload = response?.result ?? response
        const textToSearch = typeof payload === 'string' ? payload : JSON.stringify(payload)
        const expected = String(assertion.expectedValue ?? '')
        const passed = textToSearch.includes(expected)
        return {
          assertion,
          passed,
          actualValue: textToSearch.slice(0, 100) + (textToSearch.length > 100 ? '...' : ''),
          message: passed
            ? `Response text contains expected substring: "${expected}"`
            : `Response does not contain expected substring: "${expected}"`
        }
      }

      case 'regex_match': {
        const payload = response?.result ?? response
        const textToSearch = typeof payload === 'string' ? payload : JSON.stringify(payload)
        const pattern = new RegExp(String(assertion.expectedValue ?? ''))
        const passed = pattern.test(textToSearch)
        return {
          assertion,
          passed,
          actualValue: textToSearch.slice(0, 100) + (textToSearch.length > 100 ? '...' : ''),
          message: passed
            ? `Response matched regular expression: /${assertion.expectedValue}/`
            : `Response failed to match regex pattern: /${assertion.expectedValue}/`
        }
      }

      default:
        return {
          assertion,
          passed: false,
          message: `Unsupported assertion type: ${(assertion as any).type}`
        }
    }
  } catch (err) {
    return {
      assertion,
      passed: false,
      message: `Assertion evaluation error: ${err instanceof Error ? err.message : String(err)}`
    }
  }
}

/**
 * Runs a single test case against the tool executor function.
 */
export async function executeTestCase(
  testCase: ContractTestCase,
  executor: (toolName: string, args: Record<string, any>) => Promise<{
    success: boolean
    result?: unknown
    durationMs?: number
    error?: string
  }>
): Promise<ContractTestCaseResult> {
  if (!testCase.enabled) {
    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      toolName: testCase.toolName,
      status: 'skipped',
      durationMs: 0,
      assertionResults: []
    }
  }

  const startTime = Date.now()
  try {
    const rawResponse = await executor(testCase.toolName, testCase.arguments)
    const durationMs = rawResponse?.durationMs ?? (Date.now() - startTime)

    const assertionResults = testCase.assertions.map((assertion) =>
      evaluateAssertion(assertion, rawResponse, durationMs)
    )

    const hasFailure = assertionResults.some((r) => !r.passed)

    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      toolName: testCase.toolName,
      status: hasFailure ? 'failed' : 'passed',
      durationMs,
      assertionResults,
      rawResponse,
      error: rawResponse?.error
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      toolName: testCase.toolName,
      status: 'error',
      durationMs,
      assertionResults: [],
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Runs an entire test suite sequentially and generates a report.
 */
export async function runContractTestSuite(
  suite: ContractTestSuite,
  executor: (toolName: string, args: Record<string, any>) => Promise<{
    success: boolean
    result?: unknown
    durationMs?: number
    error?: string
  }>,
  onProgress?: (completed: number, total: number, latestResult: ContractTestCaseResult) => void
): Promise<ContractTestReport> {
  const results: ContractTestCaseResult[] = []
  const activeCases = suite.testCases.filter((c) => c.enabled)
  let passedCount = 0
  let failedCount = 0
  let totalDuration = 0

  for (let i = 0; i < activeCases.length; i++) {
    const testCase = activeCases[i]
    if (!testCase) continue
    const result = await executeTestCase(testCase, executor)
    results.push(result)

    if (result.status === 'passed') passedCount++
    if (result.status === 'failed' || result.status === 'error') failedCount++
    totalDuration += result.durationMs

    if (onProgress) {
      onProgress(i + 1, activeCases.length, result)
    }
  }

  const avgDurationMs = activeCases.length > 0 ? Math.round(totalDuration / activeCases.length) : 0

  return {
    id: 'report_' + Date.now(),
    suiteId: suite.id,
    suiteName: suite.name,
    timestamp: Date.now(),
    totalTests: activeCases.length,
    passedCount,
    failedCount,
    avgDurationMs,
    results
  }
}

/**
 * Generates a formatted Markdown report suitable for CI/CD, GitHub, or local export.
 */
export function generateMarkdownReport(report: ContractTestReport): string {
  const dateStr = new Date(report.timestamp).toLocaleString()
  const passRate = report.totalTests > 0 ? Math.round((report.passedCount / report.totalTests) * 100) : 0

  let md = `# MCP Contract Test Report: ${report.suiteName}\n\n`
  md += `**Date:** ${dateStr}  \n`
  md += `**Total Tests:** ${report.totalTests} | **Passed:** ${report.passedCount} | **Failed:** ${report.failedCount} | **Pass Rate:** ${passRate}% | **Avg Duration:** ${report.avgDurationMs}ms\n\n`
  md += `| Status | Test Case | Tool | Duration | Assertions Passed |\n`
  md += `| :--- | :--- | :--- | :--- | :--- |\n`

  for (const res of report.results) {
    const icon = res.status === 'passed' ? 'PASS' : res.status === 'failed' ? 'FAIL' : res.status.toUpperCase()
    const passAssertions = res.assertionResults.filter((a) => a.passed).length
    const totalAssertions = res.assertionResults.length
    md += `| **${icon}** | ${res.testCaseName} | \`${res.toolName}\` | ${res.durationMs}ms | ${passAssertions}/${totalAssertions} |\n`
  }

  md += `\n## Detailed Assertions\n\n`
  for (const res of report.results) {
    md += `### ${res.testCaseName} (\`${res.toolName}\`)\n`
    if (res.error) {
      md += `> **Error:** ${res.error}\n\n`
    }
    for (const a of res.assertionResults) {
      const check = a.passed ? 'PASS' : 'FAIL'
      md += `- [${check}] **${a.assertion.type}**: ${a.message}\n`
    }
    md += `\n`
  }

  return md
}
