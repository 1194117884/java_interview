export function createMetrics() {
    const entries = []
    return {
        record(entry) { entries.push({ ...entry }) },
        snapshot() {
            const sessions = new Set(entries.map(entry => entry.sessionId)).size
            const totalLatency = entries.reduce((sum, entry) => sum + entry.latencyMs, 0)
            return {
                sessions,
                tokens: entries.reduce((sum, entry) => sum + entry.inputTokens + entry.outputTokens, 0),
                toolCalls: entries.reduce((sum, entry) => sum + entry.toolCalls, 0),
                averageLatencyMs: entries.length ? Math.round(totalLatency / entries.length) : 0,
                failureRate: entries.length ? entries.filter(entry => !entry.success).length / entries.length : 0,
            }
        },
    }
}
