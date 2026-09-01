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
