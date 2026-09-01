import assert from 'node:assert/strict'
import test from 'node:test'
import {
    analyzeJobDescription,
    createAgentTurnOutput,
    createInterviewReport,
    searchQuestions,
} from '../src/lib/interviewEngine'

test('JD analysis extracts Java backend skills', () => {
    const job = analyzeJobDescription('Java 后端工程师', '负责高并发支付系统，使用 Redis、MySQL、Kafka 和 Spring Boot。')

    assert.deepEqual(job.skills, ['Java 并发', 'MySQL', 'Redis', '消息队列', '高并发与稳定性', 'Spring', '系统设计'])
    assert.equal(job.title, 'Java 后端工程师')
})

test('question search returns metadata and respects difficulty', () => {
    const questions = searchQuestions('', { categories: ['Java并发'], difficulty: '冲刺' })

    assert.ok(questions.length > 0)
    assert.ok(questions.every(question => question.difficulty === '冲刺'))
    assert.ok(questions.every(question => question.followUpHints?.length))
})

test('core skill answer produces a structured follow-up decision', () => {
    const job = analyzeJobDescription('Java 后端工程师', '需要熟悉并发、线程池和锁。')
    const question = searchQuestions('', { categories: ['Java并发'] })[0]
    const answer = '在订单系统中我负责线程池隔离方案，因为不同业务的流量模型不同，所以分别配置队列和拒绝策略。我们通过压测验证方案，最终将峰值 QPS 提升到 3000，平均延迟控制在 20ms，并持续监控队列深度和拒绝次数。'
    const output = createAgentTurnOutput(question, answer, job, 0)

    assert.equal(output.isCoreSkill, true)
    assert.equal(output.nextAction, 'follow_up')
    assert.ok(output.question)
    assert.equal(output.memoryCandidates.length, 0)
})

test('report surfaces missing project evidence as a risk', () => {
    const report = createInterviewReport([{ answer: '我不清楚这个问题。', score: 0 }], 'technical', null)

    assert.ok(report.risks.some(risk => risk.includes('项目职责')))
    assert.ok(report.risks.some(risk => risk.includes('知识缺口')))
})
