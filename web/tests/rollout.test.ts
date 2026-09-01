import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

test('rollout plan defines the four MVP observation metrics', () => {
    const plan = readFileSync('../docs/ROLLOUT.md', 'utf8')
    ;['完成率', '平均轮数', '报告查看率', '薄弱点纠正率'].forEach(metric => assert.ok(plan.includes(metric)))
})
