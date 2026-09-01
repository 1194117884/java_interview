const fallbackRecords = new Map()
const resources = new Set(['companies', 'jobs', 'sessions', 'reports', 'memories'])
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })
const userFrom = request => {
    const value = request.headers.get('authorization') || ''
    return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}
async function readRecords(env, userId, resource) {
    if (!env.DB) return fallbackRecords.get(`${userId}:${resource}`) || []
    const rows = await env.DB.prepare('SELECT id, payload_json FROM api_records WHERE user_id = ?1 AND resource = ?2 ORDER BY created_at').bind(userId, resource).all()
    return rows.results.map(row => JSON.parse(row.payload_json))
}
async function writeRecords(env, userId, resource, records) {
    if (!env.DB) { fallbackRecords.set(`${userId}:${resource}`, records); return }
    await env.DB.batch([
        env.DB.prepare('DELETE FROM api_records WHERE user_id = ?1 AND resource = ?2').bind(userId, resource),
        ...records.map(record => env.DB.prepare('INSERT INTO api_records (id, user_id, resource, payload_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5)').bind(record.id, userId, resource, JSON.stringify(record), new Date().toISOString())),
    ])
}
export default {
    async fetch(request, env) {
        const url = new URL(request.url)
        if (request.method === 'GET' && url.pathname === '/health') return json({ service: 'java-interview-api', status: 'ok' })
        const userId = userFrom(request)
        if (!userId) return json({ error: 'unauthorized' }, 401)
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
