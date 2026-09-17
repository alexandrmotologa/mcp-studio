import { describe, it, expect } from 'vitest'
import {
  evaluateAssertion,
  getNestedProperty,
  executeTestCase,
  runContractTestSuite,
  generateMarkdownReport
} from '../../src/renderer/src/utils/contractTesterEngine'
import { ContractTestSuite, ContractTestCase } from '../../src/shared/types'

describe('Contract Tester Engine Unit Tests', () => {
  describe('getNestedProperty', () => {
    it('should retrieve nested properties using dot and array index notation', () => {
      const target = {
        result: {
          content: [
            { type: 'text', text: 'Hello World' },
            { type: 'image', data: 'base64...' }
          ],
          count: 42
        }
      }

      expect(getNestedProperty(target, 'result.count')).toBe(42)
      expect(getNestedProperty(target, 'result.content[0].type')).toBe('text')
      expect(getNestedProperty(target, 'result.content[0].text')).toBe('Hello World')
      expect(getNestedProperty(target, 'result.content[1].type')).toBe('image')
      expect(getNestedProperty(target, 'result.nonExistent')).toBeUndefined()
    })
  })

  describe('evaluateAssertion', () => {
    it('should validate status_success assertion', () => {
      const successRes = { success: true, result: { content: [] } }
      const errRes = { success: false, error: 'RPC failed', isError: true }

      const passResult = evaluateAssertion({ id: 'a1', type: 'status_success' }, successRes, 50)
      expect(passResult.passed).toBe(true)

      const failResult = evaluateAssertion({ id: 'a2', type: 'status_success' }, errRes, 50)
      expect(failResult.passed).toBe(false)
    })

    it('should validate duration_lt threshold', () => {
      const assertion = { id: 'a3', type: 'duration_lt' as const, toleranceMs: 150 }

      expect(evaluateAssertion(assertion, {}, 120).passed).toBe(true)
      expect(evaluateAssertion(assertion, {}, 200).passed).toBe(false)
    })

    it('should validate json_path_equals', () => {
      const response = {
        result: {
          status: 'ok',
          items: [{ id: 101, name: 'Alpha' }]
        }
      }

      const pass = evaluateAssertion(
        { id: 'a4', type: 'json_path_equals', path: 'result.items[0].name', expectedValue: 'Alpha' },
        response,
        30
      )
      expect(pass.passed).toBe(true)

      const fail = evaluateAssertion(
        { id: 'a5', type: 'json_path_equals', path: 'result.items[0].name', expectedValue: 'Beta' },
        response,
        30
      )
      expect(fail.passed).toBe(false)
    })

    it('should validate contains_text and regex_match', () => {
      const response = {
        result: {
          message: 'Database query executed with 45 records returned'
        }
      }

      const containsPass = evaluateAssertion(
        { id: 'a6', type: 'contains_text', expectedValue: '45 records' },
        response,
        20
      )
      expect(containsPass.passed).toBe(true)

      const regexPass = evaluateAssertion(
        { id: 'a7', type: 'regex_match', expectedValue: '\\d+ records' },
        response,
        20
      )
      expect(regexPass.passed).toBe(true)

      const regexFail = evaluateAssertion(
        { id: 'a8', type: 'regex_match', expectedValue: '^Error:' },
        response,
        20
      )
      expect(regexFail.passed).toBe(false)
    })
  })

  describe('runContractTestSuite and generateMarkdownReport', () => {
    it('should run suite and generate formatted markdown report', async () => {
      const testCase: ContractTestCase = {
        id: 'tc-1',
        name: 'Query Users Tool Contract',
        toolName: 'query_database',
        arguments: { sql: 'SELECT * FROM users' },
        enabled: true,
        assertions: [
          { id: 'a1', type: 'status_success' },
          { id: 'a2', type: 'duration_lt', toleranceMs: 300 }
        ]
      }

      const suite: ContractTestSuite = {
        id: 'suite-1',
        serverId: 'srv-1',
        serverName: 'Database Server',
        name: 'Core Database Tool Regression Suite',
        testCases: [testCase],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      const mockExecutor = async (toolName: string, args: Record<string, any>) => {
        return {
          success: true,
          result: { content: [{ type: 'text', text: '10 rows returned' }] },
          durationMs: 85
        }
      }

      const report = await runContractTestSuite(suite, mockExecutor)
      expect(report.totalTests).toBe(1)
      expect(report.passedCount).toBe(1)
      expect(report.failedCount).toBe(0)

      const md = generateMarkdownReport(report)
      expect(md).toContain('# MCP Contract Test Report')
      expect(md).toContain('query_database')
      expect(md).toContain('PASS')
    })
  })
})
