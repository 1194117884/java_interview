import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('GitHub deployment workflow publishes Worker and Pages without D1', async () => {
    const workflow = await readFile(new URL('../.github/workflows/deploy-cloudflare.yml', import.meta.url), 'utf8')
    assert.match(workflow, /push:/)
    assert.match(workflow, /wrangler deploy/)
    assert.match(workflow, /wrangler pages deploy dist/)
    assert.match(workflow, /CLOUDFLARE_API_TOKEN/)
    assert.match(workflow, /VITE_API_BASE_URL/)
    assert.doesNotMatch(workflow, /d1 migrations|d1 create|DB_BINDING/i)
})
