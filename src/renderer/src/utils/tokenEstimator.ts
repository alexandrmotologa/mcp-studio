import { JsonRpcLog, JsonRpcTokenStats, TrafficAggregateMetrics } from '../../../shared/types'

/**
 * Calculates estimated tokens, character count, and UTF-8 byte size for a JSON-RPC payload.
 */
export function estimateTokens(payload: unknown): JsonRpcTokenStats {
  if (payload === undefined || payload === null) {
    return { estimatedTokens: 0, charCount: 0, byteSize: 0 }
  }

  const str = typeof payload === 'string' ? payload : JSON.stringify(payload) || ''
  const charCount = str.length

  if (charCount === 0) {
    return { estimatedTokens: 0, charCount: 0, byteSize: 0 }
  }

  const byteSize = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(str).length : Buffer.byteLength(str, 'utf8')

  // Deterministic token heuristic: ~3.8 chars per token, minimum 1 token for non-empty text
  const estimatedTokens = Math.max(1, Math.ceil(charCount / 3.8))

  return {
    estimatedTokens,
    charCount,
    byteSize
  }
}

/**
 * Formats byte counts into human-readable strings (B, KB, MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Calculates aggregate traffic metrics including latency percentiles (P50, P95, P99).
 */
export function computeTrafficMetrics(logs: JsonRpcLog[]): TrafficAggregateMetrics {
  const totalCalls = logs.length
  let errorCount = 0
  let totalBytesTransferred = 0
  let totalEstimatedTokens = 0
  const durations: number[] = []
  const callsByServer: Record<string, number> = {}
  const callsByMethod: Record<string, number> = {}

  for (const log of logs) {
    const isErr = log.isError || Boolean((log.payload as any)?.error)
    if (isErr) errorCount++

    // Byte & Token accounting
    const bytes = log.payloadBytes ?? estimateTokens(log.payload).byteSize
    totalBytesTransferred += bytes

    const tokens = log.direction === 'outgoing'
      ? (log.requestTokens?.estimatedTokens ?? estimateTokens(log.payload).estimatedTokens)
      : (log.responseTokens?.estimatedTokens ?? estimateTokens(log.payload).estimatedTokens)
    totalEstimatedTokens += tokens

    // Latency collection
    if (typeof log.durationMs === 'number' && log.durationMs >= 0) {
      durations.push(log.durationMs)
    }

    // Server grouping
    const serverKey = log.serverName || 'Unknown Server'
    callsByServer[serverKey] = (callsByServer[serverKey] || 0) + 1

    // Method grouping
    const methodKey = log.method || (log.direction === 'incoming' ? 'response' : 'unknown')
    callsByMethod[methodKey] = (callsByMethod[methodKey] || 0) + 1
  }

  // Calculate Percentiles
  durations.sort((a, b) => a - b)
  const getPercentile = (p: number): number => {
    if (durations.length === 0) return 0
    const index = Math.min(
      Math.floor((p / 100) * durations.length),
      durations.length - 1
    )
    const val = durations[index]
    return val !== undefined ? Math.round(val) : 0
  }

  const avgDurationMs = durations.length > 0
    ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : 0

  return {
    totalCalls,
    errorCount,
    avgDurationMs,
    p50DurationMs: getPercentile(50),
    p95DurationMs: getPercentile(95),
    p99DurationMs: getPercentile(99),
    totalBytesTransferred,
    totalEstimatedTokens,
    callsByServer,
    callsByMethod
  }
}

/**
 * Downloads a timestamped JSON-RPC traffic session file.
 */
export function downloadTrafficSession(logs: JsonRpcLog[], format: 'json' | 'har' = 'json'): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  let content: string
  let filename: string
  const mimeType = 'application/json'

  if (format === 'har') {
    filename = `mcp_traffic_session_${timestamp}.har`
    const harStructure = {
      log: {
        version: '1.2',
        creator: { name: 'MCP Studio Traffic Recorder', version: '2.2.0' },
        entries: logs.map((l) => ({
          startedDateTime: new Date(l.timestamp).toISOString(),
          time: l.durationMs || 0,
          request: {
            method: 'POST',
            url: `mcp://${encodeURIComponent(l.serverName)}/${l.method || 'rpc'}`,
            httpVersion: 'JSON-RPC/2.0',
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            queryString: [],
            bodySize: l.payloadBytes || 0,
            postData: {
              mimeType: 'application/json',
              text: JSON.stringify(l.payload)
            }
          },
          response: {
            status: l.isError ? 500 : 200,
            statusText: l.isError ? 'Error' : 'OK',
            httpVersion: 'JSON-RPC/2.0',
            headers: [{ name: 'Content-Type', value: 'application/json' }],
            content: {
              size: l.payloadBytes || 0,
              mimeType: 'application/json',
              text: JSON.stringify(l.payload)
            },
            bodySize: l.payloadBytes || 0
          },
          cache: {},
          timings: { send: 0, wait: l.durationMs || 0, receive: 0 }
        }))
      }
    }
    content = JSON.stringify(harStructure, null, 2)
  } else {
    filename = `mcp_traffic_session_${timestamp}.json`
    content = JSON.stringify(logs, null, 2)
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
