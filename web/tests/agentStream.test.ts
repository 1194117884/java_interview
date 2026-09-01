import assert from 'node:assert/strict'
import test from 'node:test'
import { streamAgentPrompt } from '../src/lib/agentStream'

test('stream client assembles SSE chunks and returns a resume token', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => new Response('event: chunk\ndata: {"text":"你好"}\n\nevent: done\ndata: {"resumeToken":"r1"}\n\n', { status: 200 })
    const chunks: string[] = []
    const result = await streamAgentPrompt('s1', '下一题', { onChunk: text => chunks.push(text) })
    globalThis.fetch = originalFetch

    assert.deepEqual(chunks, ['你好'])
    assert.equal(result.resumeToken, 'r1')
})
