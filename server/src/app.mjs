import { createServer } from 'node:http'

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify(body))
}

export function createApp() {
    const memoriesByUser = new Map()
    return createServer(async (request, response) => {
        const url = new URL(request.url || '/', 'http://localhost')
        if (request.method === 'GET' && url.pathname === '/health') {
            sendJson(response, 200, { service: 'java-interview-api', status: 'ok' })
            return
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
