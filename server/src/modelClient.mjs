export async function callWithPolicy(task, options = {}) {
    const timeoutMs = options.timeoutMs || 10000
    const retries = options.retries ?? 2
    const startedAt = Date.now()
    let attempts = 0
    let lastError
    while (attempts <= retries) {
        attempts += 1
        let timer
        try {
            const result = await Promise.race([
                Promise.resolve().then(task),
                new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('model timeout'), { code: 'timeout' })), timeoutMs) }),
            ])
            clearTimeout(timer)
            options.onUsage?.({ attempts, durationMs: Date.now() - startedAt, success: true })
            return result
        } catch (error) {
            clearTimeout(timer)
            lastError = error
            if (error?.code === 'timeout') break
        }
    }
    options.onUsage?.({ attempts, durationMs: Date.now() - startedAt, success: false, reason: lastError?.code === 'timeout' ? 'timeout' : 'error' })
    throw lastError
}
