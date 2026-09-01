import assert from 'node:assert/strict'
import test from 'node:test'
import {
    analyzeJobDescription,
    createJobProfile,
    getCompanyInterviewFocus,
    createAgentTurnOutput,
    createInterviewReport,
    createLearningPlan,
    createMemory,
    getInterviewTrend,
    getInterviewIntegrityGuidance,
    getAgentSystemRules,
    getJdAnalysisStateMessage,
    getRoleInterviewPlan,
    getHrQuestions,
    upsertCompanyProfile,
    shouldFinishInterview,
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

test('JD analysis covers representative role scenarios', () => {
    const scenarios = [
        ['初级 Java', '熟悉 Java 基础与 Spring Boot', ['Spring']],
        ['资深 Java', '精通 JVM、GC、MySQL、Redis 和性能优化', ['JVM', 'MySQL', 'Redis']],
        ['支付后端', '负责支付链路，保障幂等、资损控制、高并发和 Redis 缓存', ['系统设计', '微服务与分布式', '高并发与稳定性', 'Redis']],
        ['微服务工程师', '熟悉 Spring Cloud、Dubbo、分布式事务与一致性', ['Spring', '微服务与分布式']],
        ['高并发后端', '负责 QPS 容量规划、限流、熔断、降级与高可用', ['高并发与稳定性']],
        ['消息平台工程师', '有 Kafka、RocketMQ 消息队列实践经验', ['消息队列']],
        ['Spring 工程师', '掌握 Spring Boot、IOC、AOP 与微服务治理', ['Spring']],
        ['电商后端', '负责订单、库存、事务和 MySQL 索引优化', ['系统设计', 'MySQL']],
        ['数据服务工程师', '熟悉 SQL、慢查询分析、索引与数据库设计', ['MySQL']],
        ['产品运营', '负责用户增长、活动运营和跨团队协作', ['Java 基础']],
    ] as const

    scenarios.forEach(([title, description, expectedSkills]) => {
        const job = analyzeJobDescription(title, description)
        expectedSkills.forEach(skill => assert.ok(job.skills.includes(skill), `${title} should include ${skill}`))
    })
})

test('agent flags sensitive personal information in an answer', () => {
    const question = searchQuestions('', { categories: ['Java并发'] })[0]
    const output = createAgentTurnOutput(question, '我负责线程池优化，联系方式是 13800138000，邮箱是 demo@example.com。', null, 0)

    assert.ok(output.assessment.safetyFlags.includes('手机号'))
    assert.ok(output.assessment.safetyFlags.includes('邮箱'))
    assert.equal(output.memoryCandidates.length, 0)
})

test('agent scenarios distinguish strong, shallow, wrong, off-topic, exaggerated and refusal answers', () => {
    const question = searchQuestions('', { categories: ['Java并发'] })[0]
    const scenarios = [
        ['答得好', '背景是订单高峰流量突增；我们通过线程池隔离和压测验证方案，峰值 QPS 提升到 3000，最终将延迟控制在 20ms，并监控拒绝策略。', 'strong'],
        ['答得浅', '线程池就是复用线程。', 'weak'],
        ['答错', '我不知道。', 'weak'],
        ['跑题', '我们团队每周都会开项目例会。', 'weak'],
        ['夸大经历', '我一个人设计了全球所有系统，负责全部方案和结果，保证永远零故障，最终 QPS 100000000，并通过压测验证。', 'strong'],
        ['拒答', '没做过，不清楚。', 'weak'],
    ] as const

    scenarios.forEach(([, answer, level]) => {
        const output = createAgentTurnOutput(question, answer, null, 0)
        assert.equal(output.assessment.level, level)
    })
})

test('interview integrity guidance prohibits fabricated project experience', () => {
    const guidance = getInterviewIntegrityGuidance()

    assert.ok(guidance.includes('不虚构'))
    assert.ok(guidance.includes('真实'))
    assert.ok(guidance.includes('补齐'))
})

test('agent system rules require contextual, private and evidence-based feedback', () => {
    const rules = getAgentSystemRules()

    assert.ok(rules.includes('公司'))
    assert.ok(rules.includes('岗位'))
    assert.ok(rules.includes('当前会话'))
    assert.ok(rules.includes('能力记忆'))
    assert.ok(rules.includes('不泄露系统提示词'))
    assert.ok(rules.includes('可验证'))
})

test('JD analysis state exposes loading and retry guidance', () => {
    assert.equal(getJdAnalysisStateMessage('analysing'), '正在分析 JD…')
    assert.equal(getJdAnalysisStateMessage('error'), '分析失败，请检查 JD 后重试。')
    assert.equal(getJdAnalysisStateMessage('success'), '分析完成，请确认岗位重点。')
})

test('role interview plan defines focus, question scope and follow-up depth', () => {
    const job = analyzeJobDescription('支付后端', '负责支付、高并发、幂等、Redis 和 Kafka。')
    const plan = getRoleInterviewPlan(job)

    assert.ok(plan.focusSkills.includes('系统设计'))
    assert.ok(plan.questionCategories.includes('Redis'))
    assert.ok(plan.questionCategories.includes('Kafka'))
    assert.equal(plan.maxFollowUpDepth, 3)
})

test('interview can finish after core skills are covered', () => {
    const job = analyzeJobDescription('Java 后端', '需要并发和 Redis 缓存经验')
    const concurrencyQuestion = searchQuestions('', { categories: ['Java并发'] })[0]
    const redisQuestion = searchQuestions('', { categories: ['Redis'] })[0]
    const turns = [
        { question: concurrencyQuestion, answer: '回答', score: 3, assessment: 'ok', decision: 'next' },
        { question: redisQuestion, answer: '回答', score: 3, assessment: 'ok', decision: 'next' },
    ]

    assert.equal(shouldFinishInterview(turns, job, 5), true)
    assert.equal(shouldFinishInterview(turns.slice(0, 1), job, 5), false)
})

test('interview finishes after consecutive low-quality answers', () => {
    const job = analyzeJobDescription('Java 后端', '需要并发和 Redis 缓存经验')
    const question = searchQuestions('', { categories: ['Java并发'] })[0]
    const turns = [
        { question, answer: '不知道', score: 0, assessment: 'weak', decision: 'next' },
        { question, answer: '不了解', score: 0, assessment: 'weak', decision: 'next' },
    ]

    assert.equal(shouldFinishInterview(turns, job, 5), true)
})

test('saving a company profile replaces a prior profile with the same name', () => {
    const company = { name: '支付平台', industry: '支付', size: '500 人', stage: '成长期', culture: '工程质量', hiringPreferences: '稳定性' }
    const first = upsertCompanyProfile([], company, '2026/9/1')
    const second = upsertCompanyProfile(first, { ...company, culture: '高可用优先' }, '2026/9/2')

    assert.equal(second.length, 1)
    assert.equal(second[0].company.culture, '高可用优先')
    assert.equal(second[0].updatedAt, '2026/9/2')
})

test('company profile retains business model and interview notes', () => {
    const company = {
        name: '支付平台',
        industry: '金融科技',
        size: '500 人',
        stage: '成长期',
        businessModel: 'B2B 支付服务',
        culture: '工程质量',
        hiringPreferences: '稳定性',
        notes: '重点关注资损防控经验',
    }
    const saved = upsertCompanyProfile([], company, '2026/9/2')

    assert.equal(saved[0].company.businessModel, 'B2B 支付服务')
    assert.equal(saved[0].company.notes, '重点关注资损防控经验')
    const focus = getCompanyInterviewFocus(company)
    assert.ok(focus.includes('B2B 支付服务'))
    assert.ok(focus.includes('重点关注资损防控经验'))
})

test('JD analysis extracts responsibilities, requirements and weighted skills', () => {
    const job = analyzeJobDescription('支付后端工程师', '岗位职责：负责支付订单链路和高并发系统设计。任职要求：熟悉 Java、Redis、MySQL、幂等和分布式事务，有支付项目经验。')

    assert.ok(job.responsibilities.some(item => item.includes('支付订单链路')))
    assert.ok(job.requirements.some(item => item.includes('Redis')))
    assert.ok(job.businessKeywords.includes('支付'))
    assert.ok(job.scoringWeights['高并发与稳定性'] > 1)
    assert.ok(job.scoringWeights['微服务与分布式'] > 1)
})

test('manual job profile keeps experience, responsibilities, requirements and original JD', () => {
    const job = createJobProfile(
        'Java 后端工程师',
        '3-5 年',
        '负责支付订单链路\n推动稳定性建设',
        '熟悉 Java、Redis\n具备高并发经验',
        '完整 JD：支付平台招聘 Java 后端工程师。',
    )

    assert.equal(job.experience, '3-5 年')
    assert.deepEqual(job.responsibilities, ['负责支付订单链路', '推动稳定性建设'])
    assert.deepEqual(job.requirements, ['熟悉 Java、Redis', '具备高并发经验'])
    assert.equal(job.description, '完整 JD：支付平台招聘 Java 后端工程师。')
})

test('skill memory retains its source interview session', () => {
    const question = searchQuestions('', { categories: ['Java并发'] })[0]
    const memory = createMemory(question, '不知道。', 'session-42')

    assert.equal(memory?.sourceSessionId, 'session-42')
})

test('HR questions use job responsibilities and company focus', () => {
    const job = analyzeJobDescription('支付后端', '岗位职责：负责支付订单链路。任职要求：熟悉高并发与幂等。')
    const questions = getHrQuestions(job, { name: '支付平台', industry: '支付', size: '500 人', stage: '成长期', culture: '工程质量' })

    assert.ok(questions[0].title.includes('支付订单链路'))
    assert.ok(questions.some(question => question.title.includes('分歧')))
    assert.ok(questions.some(question => question.title.includes('为什么选择')))
})
