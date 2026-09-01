import assert from 'node:assert/strict'
import test from 'node:test'
import {
    analyzeJobDescription,
    getCompanyInterviewFocus,
    createAgentTurnOutput,
    createInterviewReport,
    createLearningPlan,
    getInterviewTrend,
    searchQuestions,
} from '../src/lib/interviewEngine'

test('company profile produces interview focus from business and hiring preferences', () => {
    const focus = getCompanyInterviewFocus({
        name: '支付平台',
        industry: '支付',
        size: '500 人',
        stage: '成长期',
        culture: '重视工程质量',
        hiringPreferences: '稳定性, 主人翁意识',
    })

    assert.ok(focus.includes('资金安全、幂等与资损处理'))
    assert.ok(focus.includes('稳定性'))
    assert.ok(focus.includes('主人翁意识'))
})

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

test('report includes answer evidence rather than only conclusions', () => {
    const report = createInterviewReport([
        { answer: '我负责订单系统的缓存方案，通过压测将峰值 QPS 提升到 3000，并记录了延迟数据。', score: 4 },
    ], 'technical', null)

    assert.equal(report.evidence.length, 1)
    assert.ok(report.evidence[0].excerpt.includes('QPS'))
    assert.ok(report.evidence[0].dimensions.includes('项目真实性'))
})

test('learning plan prioritizes weak skills before developing skills', () => {
    const plan = createLearningPlan([
        { id: '1', skill: 'Redis', level: 'developing', evidence: '缺少项目数据', confidence: 0.62, updatedAt: '2026/9/1' },
        { id: '2', skill: 'Java 并发', level: 'weak', evidence: '未覆盖锁原理', confidence: 0.82, updatedAt: '2026/9/1' },
    ])

    assert.equal(plan[0].skill, 'Java 并发')
    assert.ok(plan[0].action.includes('原理'))
    assert.equal(plan[1].skill, 'Redis')
})

test('interview trend identifies score improvement across reports', () => {
    const trend = getInterviewTrend([
        { report: { overallScore: 68 } },
        { report: { overallScore: 45 } },
    ])

    assert.equal(trend.direction, 'improving')
    assert.equal(trend.change, 23)
})
