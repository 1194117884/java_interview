export interface StreamAgentOptions {
    token?: string
    signal?: AbortSignal
    retries?: number
    onChunk?: (text: string) => void
}

export async function streamAgentPrompt(sessionId: string, prompt: string, options: StreamAgentOptions = {}): Promise<{ resumeToken?: string }> {
    let attempts = 0
    const retries = options.retries ?? 1
    while (attempts <= retries) {
        attempts += 1
        try {
            const response = await fetch('/api/agent/stream', {
                method: 'POST',
                headers: { authorization: `Bearer ${options.token || 'local-user'}`, 'content-type': 'application/json' },
                body: JSON.stringify({ sessionId, prompt }),
                signal: options.signal,
            })
            if (!response.ok || !response.body) throw new Error(`stream_${response.status}`)
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let resumeToken: string | undefined
            while (true) {
                const result = await reader.read()
                buffer += decoder.decode(result.value || new Uint8Array(), { stream: !result.done })
                const events = buffer.split('\n\n')
                buffer = events.pop() || ''
                for (const event of events) {
                    const type = event.match(/^event: (.+)$/m)?.[1]
                    const data = event.match(/^data: (.+)$/m)?.[1]
                    if (!data) continue
                    const payload = JSON.parse(data) as { text?: string; resumeToken?: string }
                    if (type === 'chunk' && payload.text) options.onChunk?.(payload.text)
                    if (type === 'done') resumeToken = payload.resumeToken
                }
                if (result.done) break
            }
            return { resumeToken }
        } catch (error) {
            if (options.signal?.aborted || attempts > retries) throw error
        }
    }
    return {}
}
