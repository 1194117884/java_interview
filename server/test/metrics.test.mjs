import assert from 'node:assert/strict'
import test from 'node:test'
import { createMetrics } from '../src/metrics.mjs'

test('metrics aggregate token, tool, latency and failure indicators', () => {
    const metrics = createMetrics()
    metrics.record({ sessionId: 's1', inputTokens: 10, outputTokens: 20, toolCalls: 2, latencyMs: 100, success: true })
    metrics.record({ sessionId: 's1', inputTokens: 5, outputTokens: 5, toolCalls: 1, latencyMs: 300, success: false })
    assert.deepEqual(metrics.snapshot(), { sessions: 1, tokens: 40, toolCalls: 3, averageLatencyMs: 200, failureRate: 0.5 })
})
