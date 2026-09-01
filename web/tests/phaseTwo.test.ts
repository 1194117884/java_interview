import assert from 'node:assert/strict'
import test from 'node:test'
import { buildGrowthPlan, extractResumeProfile, toggleQuestionBookmark, getVoiceSupport } from '../src/lib/phaseTwo'

test('phase two local capabilities cover resume, bookmarks, growth and voice support', () => {
    const resume = extractResumeProfile('Java 后端工程师，熟悉 Redis、MySQL，负责高并发订单系统。')
    assert.ok(resume.skills.includes('Redis'))
    assert.ok(resume.skills.includes('MySQL'))
    assert.equal(resume.targetRole, 'Java 后端工程师')
    assert.deepEqual(toggleQuestionBookmark([], 'q1'), ['q1'])
    assert.deepEqual(toggleQuestionBookmark(['q1'], 'q1'), [])
    assert.equal(buildGrowthPlan([{ skill: 'Redis', level: 'weak' }])[0].priority, '高')
    assert.equal(getVoiceSupport({}), false)
})
