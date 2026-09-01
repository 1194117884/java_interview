import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../src/app.mjs'

test('health endpoint identifies the standalone interview API', async () => {
    const app = createApp()
    await new Promise(resolve => app.listen(0, '127.0.0.1', resolve))
    const address = app.address()
    const response = await fetch(`http://127.0.0.1:${address.port}/health`)

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { service: 'java-interview-api', status: 'ok' })
    await new Promise(resolve => app.close(resolve))
})

test('memory API requires identity and isolates users', async () => {
    const app = createApp()
    await new Promise(resolve => app.listen(0, '127.0.0.1', resolve))
    const address = app.address()
    const base = `http://127.0.0.1:${address.port}`
    const unauthorized = await fetch(`${base}/api/memories`)
    assert.equal(unauthorized.status, 401)

    const saved = await fetch(`${base}/api/memories`, {
        method: 'POST',
        headers: { authorization: 'Bearer user-a', 'content-type': 'application/json' },
        body: JSON.stringify({ skill: 'Redis' }),
    })
    assert.equal(saved.status, 201)
    const userA = await fetch(`${base}/api/memories`, { headers: { authorization: 'Bearer user-a' } })
    const userB = await fetch(`${base}/api/memories`, { headers: { authorization: 'Bearer user-b' } })
    assert.deepEqual(await userA.json(), [{ skill: 'Redis' }])
    assert.deepEqual(await userB.json(), [])
    await new Promise(resolve => app.close(resolve))
})

test('CRUD resources support create, read, update and delete per user', async () => {
    const app = createApp()
    await new Promise(resolve => app.listen(0, '127.0.0.1', resolve))
    const address = app.address()
    const base = `http://127.0.0.1:${address.port}/api/crud/companies`
    const headers = { authorization: 'Bearer user-a', 'content-type': 'application/json' }
    const created = await fetch(base, { method: 'POST', headers, body: JSON.stringify({ name: '支付平台' }) })
    assert.equal(created.status, 201)
    const company = await created.json()
    assert.equal(company.name, '支付平台')
    const updated = await fetch(`${base}/${company.id}`, { method: 'PUT', headers, body: JSON.stringify({ name: '支付平台 2.0' }) })
    assert.deepEqual(await updated.json(), { id: company.id, name: '支付平台 2.0' })
    const listed = await fetch(base, { headers: { authorization: 'Bearer user-a' } })
    assert.deepEqual(await listed.json(), [{ id: company.id, name: '支付平台 2.0' }])
    const deleted = await fetch(`${base}/${company.id}`, { method: 'DELETE', headers })
    assert.equal(deleted.status, 204)
    const afterDelete = await fetch(base, { headers: { authorization: 'Bearer user-a' } })
    const otherUser = await fetch(base, { headers: { authorization: 'Bearer user-b' } })
    assert.deepEqual(await afterDelete.json(), [])
    assert.deepEqual(await otherUser.json(), [])
    await new Promise(resolve => app.close(resolve))
})

test('agent turn endpoint returns validated structure and persists the turn', async () => {
    const app = createApp()
    await new Promise(resolve => app.listen(0, '127.0.0.1', resolve))
    const address = app.address()
    const base = `http://127.0.0.1:${address.port}`
    const response = await fetch(`${base}/api/agent/turn`, {
        method: 'POST',
        headers: { authorization: 'Bearer user-a', 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'session-1', question: '如何保证幂等？', answer: '通过业务幂等键和唯一索引避免重复处理。' }),
    })
    assert.equal(response.status, 200)
    const output = await response.json()
    assert.equal(output.nextAction, 'next_question')
    assert.equal(typeof output.assessment.score, 'number')
    assert.equal(typeof output.scoreDelta, 'number')
    assert.ok(Array.isArray(output.memoryCandidates))
    const sessions = await fetch(`${base}/api/crud/sessions`, { headers: { authorization: 'Bearer user-a' } })
    const sessionRecords = await sessions.json()
    assert.equal(sessionRecords.length, 1)
    assert.equal(sessionRecords[0].trace.model, 'rule-based')
    assert.deepEqual(sessionRecords[0].trace.tools, ['session-context', 'question-bank'])
    assert.equal(sessionRecords[0].trace.decision, 'next_question')
    await new Promise(resolve => app.close(resolve))
})

test('agent stream endpoint emits resumable answer chunks', async () => {
    const app = createApp()
    await new Promise(resolve => app.listen(0, '127.0.0.1', resolve))
    const address = app.address()
    const response = await fetch(`http://127.0.0.1:${address.port}/api/agent/stream`, {
        method: 'POST',
        headers: { authorization: 'Bearer user-a', 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'session-stream', prompt: '请给出下一题' }),
    })
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /text\/event-stream/)
    const text = await response.text()
    assert.match(text, /event: chunk/)
    assert.match(text, /event: done/)
    await new Promise(resolve => app.close(resolve))
})
