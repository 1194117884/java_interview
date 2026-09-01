import assert from 'node:assert/strict'
import test from 'node:test'
import { getModelConfig } from '../src/config.mjs'

test('model config reads provider credentials only from server environment', () => {
    assert.deepEqual(getModelConfig({}), { provider: 'local', model: 'rule-based', apiKey: undefined })
    assert.deepEqual(getModelConfig({ MODEL_PROVIDER: 'openai', MODEL_NAME: 'gpt-5', MODEL_API_KEY: 'secret' }), { provider: 'openai', model: 'gpt-5', apiKey: 'secret' })
})
