import assert from 'node:assert/strict'
import test from 'node:test'
import worker from '../src/worker.mjs'

test('Worker fetch handler serves health and authenticated CRUD routes', async () => {
    const health = await worker.fetch(new Request('https://example.com/health'), {})
    assert.equal(health.status, 200)

    const created = await worker.fetch(new Request('https://example.com/api/crud/companies', {
        method: 'POST',
        headers: { authorization: 'Bearer worker-user', 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Worker 公司' }),
    }), {})
    assert.equal(created.status, 201)
    const company = await created.json()
    const listed = await worker.fetch(new Request('https://example.com/api/crud/companies', { headers: { authorization: 'Bearer worker-user' } }), {})
    assert.deepEqual(await listed.json(), [company])
})
