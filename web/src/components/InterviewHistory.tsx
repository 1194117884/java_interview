import { useState } from 'react'
import { BarChart3, Clock3, Trash2 } from 'lucide-react'
import { getInterviewTrend, loadInterviewSessions, saveInterviewSessions, type InterviewSessionRecord } from '../lib/interviewEngine'

export function InterviewHistory() {
    const [sessions, setSessions] = useState<InterviewSessionRecord[]>(loadInterviewSessions)
    const trend = getInterviewTrend(sessions)
    const remove = (id: string) => {
        const next = sessions.filter(session => session.id !== id)
        setSessions(next)
        saveInterviewSessions(next)
    }

    return <main className="mx-auto max-w-screen-md px-4 pb-10 pt-20">
        <section className="rounded-2xl border border-hairline bg-card p-5 dark:border-hairline-dark dark:bg-card-dark"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/15 p-2.5"><BarChart3 className="h-5 w-5 text-primary" /></div><div><p className="text-xs font-medium text-primary">仅此浏览器</p><h2 className="font-display text-2xl text-ink dark:text-ink-dark">历史报告</h2></div></div><p className="mt-3 text-sm text-body dark:text-body-dark">回看不同岗位的模拟结果和风险项；删除后，记录将不再保留。</p></section>
        {trend.direction !== 'insufficient' && <section className="mt-4 rounded-xl bg-soft p-4 dark:bg-soft-dark"><p className="text-xs text-muted dark:text-muted-dark">最近两场趋势</p><p className={`mt-1 text-sm font-medium ${trend.direction === 'improving' ? 'text-green-700 dark:text-green-400' : trend.direction === 'declining' ? 'text-red-600 dark:text-red-400' : 'text-ink dark:text-ink-dark'}`}>{trend.direction === 'improving' ? `提升 ${trend.change} 分` : trend.direction === 'declining' ? `下降 ${Math.abs(trend.change)} 分` : '基本持平'}</p></section>}
        {sessions.length ? <section className="mt-4 space-y-3">{sessions.map(session => <article key={session.id} className="rounded-xl border border-hairline bg-canvas p-4 dark:border-hairline-dark dark:bg-canvas-dark"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-primary">{session.mode === 'technical' ? '技术面' : 'HR + 项目面'} · {session.difficulty} · {session.goal}</p><h3 className="mt-1 text-sm font-medium text-ink dark:text-ink-dark">{session.companyName} · {session.jobTitle}</h3><p className="mt-1 inline-flex items-center gap-1 text-xs text-muted dark:text-muted-dark"><Clock3 className="h-3.5 w-3.5" />{session.completedAt} · {session.duration} 分钟</p></div><div className="flex items-center gap-2"><span className="font-display text-2xl text-primary">{session.report.overallScore}%</span><button onClick={() => remove(session.id)} className="rounded-lg p-2 text-red-600 dark:text-red-400" aria-label="删除报告"><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-3 grid grid-cols-2 gap-2">{session.report.dimensions.map(dimension => <div key={dimension.label} className="rounded-lg bg-soft p-2 text-xs dark:bg-soft-dark"><span className="text-muted dark:text-muted-dark">{dimension.label}</span><span className="float-right font-medium text-ink dark:text-ink-dark">{dimension.score}%</span></div>)}</div>{session.report.risks.length > 0 && <p className="mt-3 text-xs text-red-600 dark:text-red-400">风险项：{session.report.risks.join('；')}</p>}</article>)}</section> : <section className="mt-4 rounded-2xl border border-dashed border-hairline p-8 text-center dark:border-hairline-dark"><h3 className="font-medium text-ink dark:text-ink-dark">还没有历史报告</h3><p className="mt-2 text-sm text-muted dark:text-muted-dark">完成一场模拟面试后，报告会保存到这里。</p></section>}
    </main>
}
