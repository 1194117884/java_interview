import searchIndex from '../data/search-index.json'

export type InterviewMode = 'technical' | 'hr'

export interface CompanyProfile {
  name: string
  industry: string
  size: string
  stage: string
  culture: string
}

export interface JobProfile {
  title: string
  experience: string
  description: string
  skills: string[]
  priorities: string[]
}

export interface InterviewQuestion {
  id: string
  categoryId: string
  title: string
  category: string
  focus: string
}

export interface SkillMemory {
  id: string
  skill: string
  level: 'weak' | 'developing' | 'strong'
  evidence: string
  confidence: number
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

  return {
    title: title || 'Java 后端工程师',
    experience: /([0-9]+)\s*[-~至到]?\s*([0-9]+)?\s*年/.exec(description)?.[0] || '未指定',
    description,
    skills: skills.length ? skills : ['Java 基础', '项目表达', '问题解决'],
    priorities: priorities.length ? priorities : ['验证 Java 基础与项目经历', '根据回答决定追问深度'],
  }
}

export function getTechnicalQuestions(job: JobProfile): InterviewQuestion[] {
  const targetCategories = skillRules
    .filter(rule => job.skills.includes(rule.name))
    .flatMap(rule => rule.categories)
  const candidates = (searchIndex as Array<{ id: string; title: string; category: string; categoryId: string }>)
    .filter(item => targetCategories.includes(item.categoryId))
    .slice(0, 12)
    .map(item => ({ ...item, focus: item.category }))

  const fallback = (searchIndex as Array<{ id: string; title: string; category: string; categoryId: string }>)
    .filter(item => ['Java基础', 'Java并发', 'JVM', 'MySQL', 'Redis'].includes(item.categoryId))
    .slice(0, 8)
    .map(item => ({ ...item, focus: item.category }))

  return candidates.length ? candidates : fallback
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

export function assessAnswer(answer: string, question: InterviewQuestion) {
  const normalized = answer.trim().toLowerCase()
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

  return { score, level, assessment, skill: question.focus }
}

export function createMemory(question: InterviewQuestion, answer: string): SkillMemory | null {
  const result = assessAnswer(answer, question)
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
