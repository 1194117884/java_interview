import type { SkillMemory } from './interviewEngine'

export interface ResumeProfile {
    targetRole: string
    skills: string[]
}

export function extractResumeProfile(text: string): ResumeProfile {
    const skills = ['Java 并发', 'JVM', 'MySQL', 'Redis', '消息队列', '微服务与分布式', '高并发与稳定性', 'Spring', '系统设计']
        .filter(skill => text.includes(skill) || (skill === 'MySQL' && /mysql|数据库/i.test(text)) || (skill === 'Redis' && /redis/i.test(text)))
    return { targetRole: text.match(/(Java[^，。\n]{0,20}(?:工程师|开发|后端))/i)?.[1] || 'Java 后端工程师', skills }
}

export function toggleQuestionBookmark(bookmarks: string[], questionId: string): string[] {
    return bookmarks.includes(questionId) ? bookmarks.filter(id => id !== questionId) : [...bookmarks, questionId]
}

export function buildGrowthPlan(memories: Array<Pick<SkillMemory, 'skill' | 'level'>>) {
    return memories.filter(memory => memory.level !== 'strong').map(memory => ({
        skill: memory.skill,
        priority: memory.level === 'weak' ? '高' as const : '中' as const,
        action: memory.level === 'weak' ? '复习原理并完成真实场景演练' : '补充项目证据和量化结果',
    }))
}

export function getVoiceSupport(environment: Record<string, unknown>): boolean {
    return typeof environment.SpeechRecognition === 'function' || typeof environment.webkitSpeechRecognition === 'function'
}
