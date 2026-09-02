const fallbackRecords = new Map()
const resources = new Set(['companies', 'jobs', 'sessions', 'reports', 'memories'])
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })
const userFrom = request => {
    const value = request.headers.get('authorization') || ''
    return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}
async function readRecords(_env, userId, resource) {
    return fallbackRecords.get(`${userId}:${resource}`) || []
}
async function writeRecords(_env, userId, resource, records) {
    fallbackRecords.set(`${userId}:${resource}`, records)
}
export default {
    async fetch(request, env) {
        const url = new URL(request.url)
        if (request.method === 'GET' && url.pathname === '/health') return json({ service: 'java-interview-api', status: 'ok' })
        const userId = userFrom(request)
        if (!userId) return json({ error: 'unauthorized' }, 401)
        if (request.method === 'POST' && url.pathname === '/api/agent/turn') {
            const input = await request.json().catch(() => null)
            if (!input?.sessionId || !input.question || !input.answer?.trim()) return json({ error: 'invalid_turn' }, 400)
            const score = input.answer.trim().length >= 50 ? 3 : input.answer.trim().length >= 20 ? 2 : 1
            const output = { nextAction: score <= 1 ? 'next_question' : 'follow_up', question: score > 1 ? `请补充“${input.question}”的验证方式和边界。` : undefined, assessment: { score, level: score >= 3 ? 'strong' : score === 2 ? 'developing' : 'weak' }, scoreDelta: score - 2, memoryCandidates: score < 3 ? [{ skill: input.question, level: score === 1 ? 'weak' : 'developing' }] : [] }
            const sessions = await readRecords(env, userId, 'sessions')
            await writeRecords(env, userId, 'sessions', [...sessions, { id: input.sessionId, question: input.question, answer: input.answer, output, trace: { model: env.MODEL_NAME || 'rule-based', tools: ['session-context', 'question-bank'], decision: output.nextAction } }])
            return json(output)
        }
        if (request.method === 'POST' && url.pathname === '/api/agent/stream') {
            const input = await request.json().catch(() => null)
            if (!input?.sessionId || !input.prompt?.trim()) return json({ error: 'invalid_stream_request' }, 400)
            const headers = { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' }
            const chunks = ['已加载当前会话上下文。', '正在结合题库生成下一题。']
            const body = chunks.map(text => `event: chunk\ndata: ${JSON.stringify({ text, sessionId: input.sessionId })}\n\n`).join('') + `event: done\ndata: ${JSON.stringify({ sessionId: input.sessionId, resumeToken: `${userId}:${input.sessionId}` })}\n\n`
            return new Response(body, { status: 200, headers })
        }
        const match = url.pathname.match(/^\/api\/crud\/([^/]+)(?:\/([^/]+))?$/)
        if (!match || !resources.has(match[1])) return json({ error: 'not_found' }, 404)
        const resource = match[1]
        const records = await readRecords(env, userId, resource)
        if (request.method === 'GET' && !match[2]) return json(records)
        if (request.method === 'POST' && !match[2]) {
            const value = await request.json().catch(() => null)
            if (!value || typeof value !== 'object') return json({ error: 'invalid_json' }, 400)
            const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...value }
            await writeRecords(env, userId, resource, [...records, record])
            return json(record, 201)
        }
        const index = records.findIndex(record => record.id === match[2])
        if (index < 0) return json({ error: 'not_found' }, 404)
        if (request.method === 'PUT') {
            const value = await request.json().catch(() => null)
            if (!value || typeof value !== 'object') return json({ error: 'invalid_json' }, 400)
            const updated = [...records]; updated[index] = { id: records[index].id, ...value }
            await writeRecords(env, userId, resource, updated)
            return json(updated[index])
        }
        if (request.method === 'DELETE') {
            await writeRecords(env, userId, resource, records.filter(record => record.id !== match[2]))
            return new Response(null, { status: 204 })
        }
        return json({ error: 'method_not_allowed' }, 405)
    },
}
