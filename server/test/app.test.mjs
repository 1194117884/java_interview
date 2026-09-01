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
