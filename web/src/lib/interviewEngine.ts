import searchIndex from '../data/search-index.json'

export type InterviewMode = 'technical' | 'hr'

export interface CompanyProfile {
  name: string
  industry: string
  size: string
  stage: string
  culture: string
  hiringPreferences?: string
}

export interface JobProfile {
  title: string
  experience: string
  description: string
  skills: string[]
  priorities: string[]
  responsibilities: string[]
  requirements: string[]
  businessKeywords: string[]
  scoringWeights: Record<string, number>
}

export interface SavedInterviewProfile {
  id: string
  company: CompanyProfile
  job: JobProfile
  updatedAt: string
}

export interface SavedCompanyProfile {
  id: string
  company: CompanyProfile
  updatedAt: string
}

export interface InterviewQuestion {
  id: string
  categoryId: string
  title: string
  category: string
  focus: string
  difficulty?: '基础' | '进阶' | '冲刺'
  scenarioTags?: string[]
  followUpHints?: string[]
}

export interface QuestionMetadata {
  skills: string[]
  difficulty: '基础' | '进阶' | '冲刺'
  experience: string
  scenarioTags: string[]
  followUpHints: string[]
}

export interface QuestionSearchFilters {
  skills?: string[]
  difficulty?: '基础' | '进阶' | '冲刺'
  categories?: string[]
}

export interface QuestionDetailResult extends InterviewQuestion {
  content: string
  metadata: QuestionMetadata
  relatedQuestions: InterviewQuestion[]
}

export interface SkillMemory {
  id: string
  skill: string
  level: 'weak' | 'developing' | 'strong'
  evidence: string
  confidence: number
  updatedAt: string
}

export interface LearningPlanItem {
  skill: string
  priority: '高' | '中'
  action: string
  evidence: string
}

export interface AnswerAssessment {
  score: number
  level: SkillMemory['level']
  assessment: string
  skill: string
  safetyFlags: string[]
}

export interface InterviewDecision {
  nextAction: 'follow_up' | 'next_question' | 'finish'
  question?: InterviewQuestion
  reason: string
}

export interface AgentTurnOutput {
  nextAction: InterviewDecision['nextAction']
  question?: InterviewQuestion
  assessment: AnswerAssessment
  scoreDelta: number
  memoryCandidates: SkillMemory[]
  reason: string
  isCoreSkill: boolean
}

export interface InterviewReport {
  overallScore: number
  dimensions: Array<{ label: string; score: number; note: string }>
  evidence: Array<{ excerpt: string; dimensions: string[] }>
  risks: string[]
  recommendation: string
}

export interface InterviewTurnRecord {
  question: InterviewQuestion
  answer: string
  score: number
  assessment: string
  decision: string
}

export interface InterviewSessionRecord {
  id: string
  completedAt: string
  companyName: string
  jobTitle: string
  mode: InterviewMode
  duration: string
  difficulty: string
  goal: string
  turns: InterviewTurnRecord[]
  report: InterviewReport
}

export interface InterviewTrend {
  change: number
  direction: 'improving' | 'declining' | 'steady' | 'insufficient'
}

export interface InterviewDraft {
  company: CompanyProfile
  job: JobProfile | null
  mode: InterviewMode
  duration: '15' | '30' | '45'
  difficulty: '基础' | '进阶' | '冲刺'
  goal: '摸底' | '冲刺'
  questions: InterviewQuestion[]
  turn: number
  turns: InterviewTurnRecord[]
  updatedAt: string
}

const skillRules = [
  { name: 'Java 并发', terms: ['并发', '线程', '线程池', '锁', 'synchronized', 'volatile', 'aqs'], categories: ['Java并发'] },
  { name: 'JVM', terms: ['jvm', 'gc', '垃圾回收', '内存', '类加载', 'oom'], categories: ['JVM'] },
  { name: 'MySQL', terms: ['mysql', 'sql', '索引', '事务', '数据库', '慢查询'], categories: ['MySQL', '分库分表'] },
  { name: 'Redis', terms: ['redis', '缓存', '缓存击穿', '缓存穿透'], categories: ['Redis', '本地缓存'] },
  { name: '消息队列', terms: ['mq', 'kafka', 'rocketmq', 'rabbitmq', '消息队列'], categories: ['Kafka', 'RocketMQ', 'RabbitMQ'] },
  { name: '微服务与分布式', terms: ['微服务', '分布式', 'dubbo', 'spring cloud', '一致性', '事务', '幂等'], categories: ['微服务', '分布式', 'Dubbo', 'SpringCloud'] },
  { name: '高并发与稳定性', terms: ['高并发', '高可用', '限流', '降级', '熔断', 'qps', '性能'], categories: ['高并发', '高可用', '高性能'] },
  { name: 'Spring', terms: ['spring', 'spring boot', 'ioc', 'aop'], categories: ['Spring'] },
  { name: '系统设计', terms: ['架构', '设计', '支付', '订单', '系统设计'], categories: ['架构设计', '场景题', '项目难点&亮点'] },
]

export function getCompanyInterviewFocus(company: CompanyProfile): string[] {
  const text = `${company.industry} ${company.culture}`.toLowerCase()
  const focus: string[] = []
  if (/支付|金融|银行/.test(text)) focus.push('资金安全、幂等与资损处理')
  if (/电商|交易|订单/.test(text)) focus.push('订单链路、库存一致性与峰值流量')
  if (/工程|质量|稳定|高可用/.test(text)) focus.push('稳定性、可观测性与故障复盘')
  if (/创业|成长期|快速/.test(`${company.stage} ${company.culture}`)) focus.push('快速交付、优先级判断与资源取舍')
  const preferences = (company.hiringPreferences || '').split(/[,，\n]/).map(item => item.trim()).filter(Boolean)
  return [...new Set([...focus, ...preferences])]
}

export function upsertCompanyProfile(profiles: SavedCompanyProfile[], company: CompanyProfile, updatedAt: string): SavedCompanyProfile[] {
  const id = company.name.trim() || '未命名公司'
  return [{ id, company, updatedAt }, ...profiles.filter(profile => profile.id !== id)].slice(0, 20)
}

const categoryMetadata: Record<string, Omit<QuestionMetadata, 'difficulty'>> = {
  Java并发: { skills: ['Java 并发'], experience: '1-5 年', scenarioTags: ['线程安全', '性能'], followUpHints: ['锁竞争时如何排查？', '如何验证线程安全？'] },
  JVM: { skills: ['JVM'], experience: '1-5 年', scenarioTags: ['性能', '线上排障'], followUpHints: ['如何定位线上问题？', '方案的代价是什么？'] },
  MySQL: { skills: ['MySQL'], experience: '1-5 年', scenarioTags: ['数据库', '性能'], followUpHints: ['索引为何会失效？', '如何验证执行计划？'] },
  Redis: { skills: ['Redis'], experience: '1-5 年', scenarioTags: ['缓存', '高可用'], followUpHints: ['缓存异常如何兜底？', '如何避免数据不一致？'] },
  Kafka: { skills: ['消息队列'], experience: '2-5 年', scenarioTags: ['异步', '可靠性'], followUpHints: ['如何保证消息不丢？', '重复消费如何处理？'] },
  RocketMQ: { skills: ['消息队列'], experience: '2-5 年', scenarioTags: ['异步', '可靠性'], followUpHints: ['如何保证消息不丢？', '重复消费如何处理？'] },
  RabbitMQ: { skills: ['消息队列'], experience: '2-5 年', scenarioTags: ['异步', '可靠性'], followUpHints: ['如何保证消息不丢？', '重复消费如何处理？'] },
  微服务: { skills: ['微服务与分布式'], experience: '2-5 年', scenarioTags: ['分布式', '一致性'], followUpHints: ['失败后如何补偿？', '如何设计幂等？'] },
  分布式: { skills: ['微服务与分布式'], experience: '2-5 年', scenarioTags: ['分布式', '一致性'], followUpHints: ['失败后如何补偿？', '如何设计幂等？'] },
  高并发: { skills: ['高并发与稳定性'], experience: '3-5 年', scenarioTags: ['容量', '稳定性'], followUpHints: ['容量如何估算？', '故障时如何降级？'] },
  高可用: { skills: ['高并发与稳定性'], experience: '3-5 年', scenarioTags: ['稳定性', '故障演练'], followUpHints: ['如何发现故障？', '如何演练恢复？'] },
  Spring: { skills: ['Spring'], experience: '1-5 年', scenarioTags: ['框架原理'], followUpHints: ['底层机制是什么？', '在项目中如何使用？'] },
  架构设计: { skills: ['系统设计'], experience: '3-5 年', scenarioTags: ['系统设计', '业务'], followUpHints: ['方案取舍是什么？', '极端流量如何处理？'] },
  场景题: { skills: ['系统设计'], experience: '3-5 年', scenarioTags: ['系统设计', '业务'], followUpHints: ['方案取舍是什么？', '极端流量如何处理？'] },
}

function inferDifficulty(title: string): QuestionMetadata['difficulty'] {
  if (/源码|实现|原理|底层|设计|优化|排查|分布式|一致性|高并发|架构/.test(title)) return '冲刺'
  if (/区别|如何|为什么|流程|机制|事务|索引|线程池/.test(title)) return '进阶'
  return '基础'
}

export function getQuestionMetadata(categoryId: string, title: string): QuestionMetadata {
  const base = categoryMetadata[categoryId] || { skills: ['Java 基础'], experience: '0-3 年', scenarioTags: ['基础'], followUpHints: ['请举一个实际使用的例子。'] }
  return { ...base, difficulty: inferDifficulty(title) }
}

export function searchQuestions(query = '', filters: QuestionSearchFilters = {}): InterviewQuestion[] {
  const normalized = query.trim().toLowerCase()
  const requestedSkills = filters.skills || []
  const candidates = searchIndex as Array<{ id: string; title: string; category: string; categoryId: string }>
  return candidates.map(item => {
    const metadata = getQuestionMetadata(item.categoryId, item.title)
    return { ...item, focus: item.category, difficulty: metadata.difficulty, scenarioTags: metadata.scenarioTags, followUpHints: metadata.followUpHints }
  }).filter(item => {
    const metadata = getQuestionMetadata(item.categoryId, item.title)
    const matchesQuery = !normalized || `${item.title} ${item.category} ${metadata.skills.join(' ')}`.toLowerCase().includes(normalized)
    const matchesSkills = !requestedSkills.length || requestedSkills.some(skill => metadata.skills.includes(skill))
    const matchesDifficulty = !filters.difficulty || item.difficulty === filters.difficulty
    const matchesCategories = !filters.categories?.length || filters.categories.includes(item.categoryId)
    return matchesQuery && matchesSkills && matchesDifficulty && matchesCategories
  })
}

export async function getQuestionDetail(id: string): Promise<QuestionDetailResult | null> {
  const indexItem = (searchIndex as Array<{ id: string; title: string; category: string; categoryId: string }>).find(item => item.id === id)
  if (!indexItem) return null
  try {
    const response = await fetch(`/data/content/${encodeURIComponent(indexItem.categoryId)}.json`)
    if (!response.ok) return null
    const categoryData = await response.json() as { questions: Array<{ id: string; title: string; content: string }> }
    const source = categoryData.questions.find(item => item.id === id)
    if (!source) return null
    const metadata = getQuestionMetadata(indexItem.categoryId, source.title)
    const relatedQuestions = searchQuestions('', { skills: metadata.skills })
      .filter(item => item.id !== id)
      .slice(0, 3)
    return {
      ...indexItem,
      focus: indexItem.category,
      difficulty: metadata.difficulty,
      scenarioTags: metadata.scenarioTags,
      followUpHints: metadata.followUpHints,
      content: source.content,
      metadata,
      relatedQuestions,
    }
  } catch {
    return null
  }
}

export function getFollowUps(question: InterviewQuestion, assessment: AnswerAssessment): string[] {
  const defaults = assessment.level === 'weak'
    ? ['请先说明核心概念，再给出一个实际使用场景。']
    : assessment.level === 'developing'
      ? ['请补充你的职责、方案取舍和量化结果。']
      : ['请说明异常边界、容量上限与验证方式。']
  return question.followUpHints?.length ? question.followUpHints : defaults
}

const hrQuestions = [
  '请用 3 分钟介绍最近一个项目：业务目标、你的职责、技术方案和结果分别是什么？',
  '这个项目中最棘手的问题是什么？你如何定位、决策并推动落地？',
  '请给出一个你影响他人或与其他团队产生分歧的例子，最终结果如何？',
  '为什么选择这个岗位？你认为自己与岗位要求最匹配和最需要补齐的分别是什么？',
  '如果入职后三个月只能完成一件事，你会优先验证或改进什么，为什么？',
]

export function analyzeJobDescription(title: string, description: string): JobProfile {
  const text = `${title} ${description}`.toLowerCase()
  const matched = skillRules.filter(rule => rule.terms.some(term => text.includes(term)))
  const skills = matched.map(rule => rule.name)
  const priorities = matched.slice(0, 4).map(rule => {
    if (rule.name === '高并发与稳定性') return '追问容量、故障处理与稳定性方案'
    if (rule.name === '系统设计') return '追问业务场景、技术取舍与量化结果'
    if (rule.name === '微服务与分布式') return '追问一致性、幂等和异常补偿'
    return `验证 ${rule.name} 的原理、实践和边界`
  })
  const fragments = description.split(/[。；;\n]/).map(item => item.trim()).filter(Boolean)
  const responsibilities = fragments.filter(item => /职责|负责|主导|设计|推动/.test(item))
  const requirements = fragments.filter(item => /要求|熟悉|掌握|经验|具备|精通/.test(item))
  const businessKeywords = ['支付', '订单', '电商', '库存', '金融', 'SaaS'].filter(keyword => text.includes(keyword.toLowerCase()))
  const scoringWeights = Object.fromEntries(matched.map(rule => [rule.name,
    rule.name === '高并发与稳定性' || rule.name === '微服务与分布式' || rule.name === '系统设计' ? 1.5 : 1,
  ]))

  return {
    title: title || 'Java 后端工程师',
    experience: /([0-9]+)\s*[-~至到]?\s*([0-9]+)?\s*年/.exec(description)?.[0] || '未指定',
    description,
    skills: skills.length ? skills : ['Java 基础', '项目表达', '问题解决'],
    priorities: priorities.length ? priorities : ['验证 Java 基础与项目经历', '根据回答决定追问深度'],
    responsibilities,
    requirements,
    businessKeywords,
    scoringWeights,
  }
}

export function getTechnicalQuestions(job: JobProfile, difficulty: QuestionMetadata['difficulty'] = '进阶'): InterviewQuestion[] {
  const targetCategories = skillRules
    .filter(rule => job.skills.includes(rule.name))
    .flatMap(rule => rule.categories)
  const exactCandidates = searchQuestions('', { categories: targetCategories, difficulty })
  const candidates = exactCandidates.length
    ? exactCandidates
    : searchQuestions('', { categories: targetCategories })
  const fallback = searchQuestions('', { categories: ['Java基础', 'Java并发', 'JVM', 'MySQL', 'Redis'], difficulty })
  return (candidates.length ? candidates : fallback).slice(0, 12)
}

export function getHrQuestions(): InterviewQuestion[] {
  return hrQuestions.map((title, index) => ({
    id: `hr-${index}`,
    title,
    category: '项目与 HR',
    categoryId: 'hr',
    focus: index < 3 ? '项目表达' : '岗位匹配',
  }))
}

export function assessAnswer(answer: string, question: InterviewQuestion): AnswerAssessment {
  const normalized = answer.trim().toLowerCase()
  const safetyFlags = getSafetyFlags(answer)
  const givesUp = ['不知道', '不清楚', '没做过', '不了解'].some(word => normalized.includes(word))
  const evidenceTerms = ['例如', '因为', '所以', '数据', 'qps', 'ms', '方案', '最终', '结果', '负责', '我们']
  const evidenceCount = evidenceTerms.filter(term => normalized.includes(term)).length
  const hasNumber = /\d+/.test(normalized)
  let score = 0
  if (normalized.length >= 50) score += 1
  if (normalized.length >= 120) score += 1
  if (evidenceCount >= 2) score += 1
  if (hasNumber) score += 1
  if (givesUp) score = 0

  const level: SkillMemory['level'] = score <= 1 ? 'weak' : score <= 2 ? 'developing' : 'strong'
  const assessment = level === 'strong'
    ? '回答包含了足够的上下文和证据，可以进入更深的边界或方案取舍追问。'
    : level === 'developing'
      ? '回答具备基本方向，但需要补充原理、取舍或真实场景的量化结果。'
      : '当前回答缺少关键原理或项目证据，建议先记录为需要复习的能力点。'

  return { score, level, assessment, skill: question.focus, safetyFlags }
}

function getSafetyFlags(answer: string): string[] {
  const flags: string[] = []
  if (/1[3-9]\d{9}/.test(answer)) flags.push('手机号')
  if (/\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b/.test(answer)) flags.push('邮箱')
  if (/\b\d{17}[\dXx]\b/.test(answer)) flags.push('身份证号')
  return flags
}

export function getFollowUp(question: InterviewQuestion, assessment: AnswerAssessment, depth: number, maxFollowUps = 2): InterviewDecision {
  if (assessment.level === 'strong' && depth < maxFollowUps) {
    return {
      nextAction: 'follow_up',
      question: {
        ...question,
        id: `${question.id}-follow-up-${depth}`,
        title: getFollowUps(question, assessment)[0],
        focus: `${question.focus} · 深挖`,
      },
      reason: '回答证据充分，继续验证方案边界和技术取舍。',
    }
  }

  if (assessment.level === 'developing' && depth === 0 && maxFollowUps > 0) {
    return {
      nextAction: 'follow_up',
      question: {
        ...question,
        id: `${question.id}-clarify`,
        title: getFollowUps(question, assessment)[0],
        focus: `${question.focus} · 补充证据`,
      },
      reason: '回答方向正确，补充可验证的项目证据后再继续。',
    }
  }

  return {
    nextAction: 'next_question',
    reason: assessment.level === 'weak'
      ? '已记录待补强点，切换到下一项能力，避免在同一薄弱点反复消耗时间。'
      : '本题已完成，继续覆盖岗位的其他重点能力。',
  }
}

export function createAgentTurnOutput(
  question: InterviewQuestion,
  answer: string,
  job: JobProfile | null,
  depth: number,
): AgentTurnOutput {
  const assessment = assessAnswer(answer, question)
  const metadata = getQuestionMetadata(question.categoryId, question.title)
  const isCoreSkill = Boolean(job?.skills.some(skill => metadata.skills.includes(skill)))
  const decision = getFollowUp(question, assessment, depth, isCoreSkill ? 2 : 1)
  const memory = createMemory(question, answer)
  return {
    nextAction: decision.nextAction,
    question: decision.question,
    assessment,
    scoreDelta: assessment.score - 2,
    memoryCandidates: memory ? [memory] : [],
    reason: decision.reason,
    isCoreSkill,
  }
}

export function shouldFinishInterview(
  turns: Array<{ question: InterviewQuestion }>,
  job: JobProfile | null,
  maxQuestions: number,
): boolean {
  if (turns.length >= maxQuestions) return true
  if (!job || turns.length < 2) return false
  const coreSkills = job.skills.slice(0, 3)
  const coveredSkills = new Set(turns.flatMap(turn => getQuestionMetadata(turn.question.categoryId, turn.question.title).skills))
  return coreSkills.length > 0 && coreSkills.every(skill => coveredSkills.has(skill))
}

export function createInterviewReport(
  turns: Array<{ answer: string; score: number }>,
  mode: InterviewMode,
  job: JobProfile | null,
  company?: CompanyProfile,
): InterviewReport {
  const average = turns.length ? Math.round(turns.reduce((total, item) => total + item.score, 0) / (turns.length * 4) * 100) : 0
  const answers = turns.map(item => item.answer.toLowerCase())
  const projectEvidence = answers.filter(answer => /负责|项目|数据|qps|ms|结果|最终/.test(answer)).length
  const structuredAnswers = answers.filter(answer => /背景|方案|取舍|结果|因为|所以/.test(answer)).length
  const risks: string[] = []
  if (turns.length < 2) risks.push('有效回答较少，当前结论置信度有限。')
  if (projectEvidence < Math.max(1, Math.ceil(turns.length / 2))) risks.push('项目职责或量化结果不足，建议准备可核验的案例。')
  if (answers.some(answer => /不知道|不清楚|没做过|不了解/.test(answer))) risks.push('出现明确的知识缺口，建议优先复习对应题目。')

  const technicalScore = mode === 'technical' ? average : Math.max(average - 8, 0)
  const projectScore = Math.min(100, projectEvidence * 28 + 20)
  const expressionScore = Math.min(100, structuredAnswers * 25 + 20)
  const fitScore = Math.min(100, Math.round((average + (job?.skills.length || 1) * 9) / 1.4))
  const companyFocus = company ? getCompanyInterviewFocus(company) : []
  const sensitiveFlags = turns.flatMap(item => getSafetyFlags(item.answer))
  if (sensitiveFlags.length) risks.push(`检测到${[...new Set(sensitiveFlags)].join('、')}，已排除出报告证据。`)
  const evidence = turns.filter(item => item.answer.trim() && !getSafetyFlags(item.answer).length).map(item => {
    const answer = item.answer.trim()
    const dimensions = ['技术深度']
    if (/负责|项目|数据|qps|ms|结果|最终/.test(answer.toLowerCase())) dimensions.push('项目真实性')
    if (/背景|方案|取舍|结果|因为|所以/.test(answer.toLowerCase())) dimensions.push('表达结构')
    return { excerpt: answer.length > 100 ? `${answer.slice(0, 100)}…` : answer, dimensions }
  })
  return {
    overallScore: average,
    dimensions: [
      { label: '技术深度', score: technicalScore, note: technicalScore >= 70 ? '能够继续接受边界与取舍追问。' : '建议补齐原理与故障场景。' },
      { label: '项目真实性', score: projectScore, note: projectEvidence ? '已出现项目证据。' : '缺少职责、数据或结果证据。' },
      { label: '表达结构', score: expressionScore, note: structuredAnswers ? '回答包含部分结构化叙述。' : '建议按背景、方案、取舍、结果组织回答。' },
      { label: '岗位匹配度', score: fitScore, note: `本轮覆盖 ${[...(job?.skills.slice(0, 2) || ['基础能力']), ...companyFocus.slice(0, 1)].join('、')} 等重点。` },
    ],
    evidence,
    risks,
    recommendation: risks.length
      ? `下一轮优先用一个真实项目案例补足证据，再进行技术深挖${companyFocus.length ? `，并关注 ${companyFocus[0]}` : ''}。`
      : `下一轮可提高难度，练习极端场景和方案取舍${companyFocus.length ? `，重点围绕 ${companyFocus[0]}` : ''}。`,
  }
}

export function createMemory(question: InterviewQuestion, answer: string): SkillMemory | null {
  const result = assessAnswer(answer, question)
  if (result.safetyFlags.length) return null
  if (result.level === 'strong') return null
  return {
    id: `${question.id}-${Date.now()}`,
    skill: result.skill,
    level: result.level,
    evidence: result.level === 'weak'
      ? `在“${question.title}”中，回答未覆盖关键原理或具体证据。`
      : `在“${question.title}”中，具备基础认知，但原理或项目数据仍不完整。`,
    confidence: result.level === 'weak' ? 0.82 : 0.62,
    updatedAt: new Date().toLocaleDateString('zh-CN'),
  }
}

export function createLearningPlan(memories: SkillMemory[]): LearningPlanItem[] {
  return [...memories]
    .filter(memory => memory.level !== 'strong')
    .sort((left, right) => Number(right.level === 'weak') - Number(left.level === 'weak') || right.confidence - left.confidence)
    .slice(0, 3)
    .map(memory => ({
      skill: memory.skill,
      priority: memory.level === 'weak' ? '高' : '中',
      action: memory.level === 'weak'
        ? '先复习核心原理，再用一个真实场景完成口头演练。'
        : '补充职责、方案取舍和可量化结果，形成可验证的项目案例。',
      evidence: memory.evidence,
    }))
}

export function getInterviewTrend(sessions: Array<{ report: { overallScore: number } }>): InterviewTrend {
  if (sessions.length < 2) return { change: 0, direction: 'insufficient' }
  const latest = sessions[0].report.overallScore
  const previous = sessions[1].report.overallScore
  const change = latest - previous
  return {
    change,
    direction: change >= 5 ? 'improving' : change <= -5 ? 'declining' : 'steady',
  }
}

export function saveMemories(memories: SkillMemory[]) {
  localStorage.setItem('java-interview-ai-memory', JSON.stringify(memories))
}

export function loadMemories(): SkillMemory[] {
  try {
    const value = JSON.parse(localStorage.getItem('java-interview-ai-memory') || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function loadInterviewProfiles(): SavedInterviewProfile[] {
  try {
    const value = JSON.parse(localStorage.getItem('java-interview-profiles') || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveInterviewProfiles(profiles: SavedInterviewProfile[]) {
  localStorage.setItem('java-interview-profiles', JSON.stringify(profiles))
}

export function loadCompanyProfiles(): SavedCompanyProfile[] {
  try {
    const value = JSON.parse(localStorage.getItem('java-interview-companies') || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveCompanyProfiles(profiles: SavedCompanyProfile[]) {
  localStorage.setItem('java-interview-companies', JSON.stringify(profiles))
}

export function loadActiveCompany(): CompanyProfile {
  try {
    return JSON.parse(localStorage.getItem('java-interview-active-company') || 'null') || { name: '', industry: '', size: '', stage: '', culture: '' }
  } catch {
    return { name: '', industry: '', size: '', stage: '', culture: '' }
  }
}

export function saveActiveCompany(company: CompanyProfile) {
  localStorage.setItem('java-interview-active-company', JSON.stringify(company))
}

export function loadInterviewSessions(): InterviewSessionRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem('java-interview-sessions') || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveInterviewSessions(sessions: InterviewSessionRecord[]) {
  localStorage.setItem('java-interview-sessions', JSON.stringify(sessions))
}

export function loadInterviewDraft(): InterviewDraft | null {
  try {
    const value = JSON.parse(localStorage.getItem('java-interview-draft') || 'null')
    return value && Array.isArray(value.questions) && Array.isArray(value.turns) ? value : null
  } catch {
    return null
  }
}

export function saveInterviewDraft(draft: InterviewDraft) {
  localStorage.setItem('java-interview-draft', JSON.stringify(draft))
}

export function clearInterviewDraft() {
  localStorage.removeItem('java-interview-draft')
}
