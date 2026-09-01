import { createServer } from 'node:http'

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify(body))
}

export function createApp() {
    const memoriesByUser = new Map()
    const crudResources = new Set(['companies', 'jobs', 'sessions', 'reports', 'memories'])
    const recordsByUser = new Map()
    return createServer(async (request, response) => {
        const url = new URL(request.url || '/', 'http://localhost')
        if (request.method === 'GET' && url.pathname === '/health') {
            sendJson(response, 200, { service: 'java-interview-api', status: 'ok' })
            return
        }
        const crudMatch = url.pathname.match(/^\/api\/crud\/([^/]+)(?:\/([^/]+))?$/)
        if (crudMatch && crudResources.has(crudMatch[1])) {
            const authorization = request.headers.authorization || ''
            const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
            if (!token) {
                sendJson(response, 401, { error: 'unauthorized' })
                return
            }
            const key = `${token}:${crudMatch[1]}`
            const records = recordsByUser.get(key) || []
            if (request.method === 'GET' && !crudMatch[2]) {
                sendJson(response, 200, records)
                return
            }
            if (request.method === 'POST' && !crudMatch[2]) {
                let body = ''
                for await (const chunk of request) body += chunk
                try {
                    const value = JSON.parse(body)
                    const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...value }
                    recordsByUser.set(key, [...records, record])
                    sendJson(response, 201, record)
                } catch {
                    sendJson(response, 400, { error: 'invalid_json' })
                }
                return
            }
            const index = records.findIndex(record => record.id === crudMatch[2])
            if (index < 0) {
                sendJson(response, 404, { error: 'not_found' })
                return
            }
            if (request.method === 'PUT') {
                let body = ''
                for await (const chunk of request) body += chunk
                try {
                    const next = { id: records[index].id, ...JSON.parse(body) }
                    const updated = [...records]; updated[index] = next; recordsByUser.set(key, updated)
                    sendJson(response, 200, next)
                } catch {
                    sendJson(response, 400, { error: 'invalid_json' })
                }
                return
            }
            if (request.method === 'DELETE') {
                recordsByUser.set(key, records.filter(record => record.id !== crudMatch[2]))
                response.writeHead(204); response.end()
                return
            }
        }
        if (url.pathname === '/api/memories') {
            const authorization = request.headers.authorization || ''
            const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
            if (!token) {
                sendJson(response, 401, { error: 'unauthorized' })
                return
            }
            if (request.method === 'GET') {
                sendJson(response, 200, memoriesByUser.get(token) || [])
                return
            }
            if (request.method === 'POST') {
                let body = ''
                for await (const chunk of request) body += chunk
                try {
                    const memory = JSON.parse(body)
                    if (!memory || typeof memory.skill !== 'string' || !memory.skill.trim()) throw new Error('invalid')
                    const memories = memoriesByUser.get(token) || []
                    const next = [...memories, { skill: memory.skill.trim() }]
                    memoriesByUser.set(token, next)
                    sendJson(response, 201, next.at(-1))
                } catch {
                    sendJson(response, 400, { error: 'invalid_memory' })
                }
                return
            }
        }
        sendJson(response, 404, { error: 'not_found' })
    })
}
