import { useState } from 'react'
import { CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react'
import { loadMemories, saveMemories, type SkillMemory } from '../lib/interviewEngine'

export function SkillMemoryProfile() {
    const [memories, setMemories] = useState<SkillMemory[]>(loadMemories)

    const update = (id: string, level: SkillMemory['level']) => {
        const next = memories.map(memory => memory.id === id
            ? { ...memory, level, updatedAt: new Date().toLocaleDateString('zh-CN') }
            : memory)
        setMemories(next)
        saveMemories(next)
    }
    const remove = (id: string) => {
        const next = memories.filter(memory => memory.id !== id)
        setMemories(next)
        saveMemories(next)
    }

    return <main className="mx-auto max-w-screen-md px-4 pb-10 pt-20">
        <section className="rounded-2xl border border-hairline bg-card p-5 dark:border-hairline-dark dark:bg-card-dark">
            <div className="flex gap-3"><div className="h-fit rounded-xl bg-primary/15 p-2.5"><ShieldAlert className="h-5 w-5 text-primary" /></div><div><p className="text-xs font-medium text-primary">仅此浏览器</p><h2 className="font-display text-2xl text-ink dark:text-ink-dark">个人能力画像</h2><p className="mt-2 text-sm text-body dark:text-body-dark">这些记录来自你的模拟回答。你可以更正判断、标记已改善，或随时删除；它们不会上传或用于其他用户。</p></div></div>
        </section>
        {memories.length ? <section className="mt-4 space-y-3">{memories.map(memory => <article key={memory.id} className="rounded-xl border border-hairline bg-canvas p-4 dark:border-hairline-dark dark:bg-canvas-dark"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-primary">最近观测：{memory.updatedAt} · 置信度 {Math.round(memory.confidence * 100)}%</p><h3 className="mt-1 font-medium text-ink dark:text-ink-dark">{memory.skill}</h3></div><span className={`rounded-full px-2.5 py-1 text-xs ${memory.level === 'weak' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : memory.level === 'strong' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-primary/10 text-primary'}`}>{memory.level === 'weak' ? '需要补强' : memory.level === 'strong' ? '已改善' : '补充证据'}</span></div><p className="mt-3 text-sm text-body dark:text-body-dark">{memory.evidence}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => update(memory.id, 'strong')} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary"><CheckCircle2 className="h-3.5 w-3.5" />我已改善</button><button onClick={() => update(memory.id, 'developing')} className="rounded-lg border border-hairline px-3 py-2 text-xs text-body dark:border-hairline-dark dark:text-body-dark">判断不准确 / 需复核</button><button onClick={() => remove(memory.id)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-red-600 dark:text-red-400"><Trash2 className="h-3.5 w-3.5" />删除</button></div></article>)}</section> : <section className="mt-4 rounded-2xl border border-dashed border-hairline p-8 text-center dark:border-hairline-dark"><h3 className="font-medium text-ink dark:text-ink-dark">还没有能力记录</h3><p className="mt-2 text-sm text-muted dark:text-muted-dark">完成一次 AI 模拟面试后，回答中缺少原理或项目证据的技能会显示在这里。</p></section>}
    </main>
}
