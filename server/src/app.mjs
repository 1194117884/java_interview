import { createServer } from 'node:http'

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify(body))
}

export function createApp() {
    return createServer((request, response) => {
        const url = new URL(request.url || '/', 'http://localhost')
        if (request.method === 'GET' && url.pathname === '/health') {
            sendJson(response, 200, { service: 'java-interview-api', status: 'ok' })
            return
        }
        sendJson(response, 404, { error: 'not_found' })
    })
}
