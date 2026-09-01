import assert from 'node:assert/strict'
import test from 'node:test'
import { callWithPolicy } from '../src/modelClient.mjs'

test('model policy retries transient failures and records usage', async () => {
    let attempts = 0
    const logs = []
    const result = await callWithPolicy(async () => {
        attempts += 1
        if (attempts < 2) throw new Error('temporary')
        return { answer: 'ok' }
    }, { retries: 2, onUsage: entry => logs.push(entry) })

    assert.deepEqual(result, { answer: 'ok' })
    assert.equal(attempts, 2)
    assert.equal(logs[0].success, true)
    assert.equal(logs[0].attempts, 2)
})

test('model policy times out and logs a failed call', async () => {
    const logs = []
    await assert.rejects(() => callWithPolicy(() => new Promise(() => {}), { timeoutMs: 5, retries: 0, onUsage: entry => logs.push(entry) }), /timeout/)
    assert.equal(logs[0].success, false)
    assert.equal(logs[0].reason, 'timeout')
})
