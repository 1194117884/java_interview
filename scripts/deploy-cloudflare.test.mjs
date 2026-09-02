import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('one-click Cloudflare deploy script is database-free and deploys both apps', async () => {
    const script = await readFile(new URL('./deploy-cloudflare.sh', import.meta.url), 'utf8')
    assert.match(script, /set -Eeuo pipefail/)
    assert.match(script, /wrangler deploy/)
    assert.match(script, /npm run build/)
    assert.match(script, /wrangler pages deploy dist/)
    assert.doesNotMatch(script, /d1|D1|DB_BINDING/)
    assert.match(script, /VITE_API_BASE_URL/)
})
