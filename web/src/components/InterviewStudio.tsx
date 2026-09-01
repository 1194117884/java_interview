import { useMemo, useState } from 'react'
import { BarChart3, Bot, Bookmark, Building2, CheckCircle2, ChevronRight, ClipboardList, Lightbulb, MessageSquare, ShieldAlert, Sparkles, UserRound } from 'lucide-react'
import { analyzeJobDescription, clearInterviewDraft, createAgentTurnOutput, createInterviewReport, getHrQuestions, getTechnicalQuestions, loadInterviewDraft, loadInterviewProfiles, loadInterviewSessions, loadMemories, saveInterviewDraft, saveInterviewProfiles, saveInterviewSessions, saveMemories, type CompanyProfile, type InterviewMode, type InterviewQuestion, type JobProfile, type InterviewTurnRecord, type SavedInterviewProfile, type SkillMemory } from '../lib/interviewEngine'

type Step = 'setup' | 'interview' | 'report'
type Turn = InterviewTurnRecord
const emptyCompany: CompanyProfile = { name: '', industry: '', size: '', stage: '', culture: '' }
const splitItems = (value: string) => value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean)

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
    return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">{label}</span><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-primary dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark" /></label>
}

export function InterviewStudio() {
    const [step, setStep] = useState<Step>('setup')
    const [company, setCompany] = useState<CompanyProfile>(emptyCompany)
    const [jobTitle, setJobTitle] = useState('Java 后端工程师')
    const [jd, setJd] = useState('')
    const [job, setJob] = useState<JobProfile | null>(null)
    const [skillInput, setSkillInput] = useState('')
    const [priorityInput, setPriorityInput] = useState('')
    const [savedProfiles, setSavedProfiles] = useState<SavedInterviewProfile[]>(loadInterviewProfiles)
    const [draft, setDraft] = useState(loadInterviewDraft)
    const [mode, setMode] = useState<InterviewMode>('technical')
    const [duration, setDuration] = useState<'15' | '30' | '45'>('30')
    const [difficulty, setDifficulty] = useState<'基础' | '进阶' | '冲刺'>('进阶')
    const [goal, setGoal] = useState<'摸底' | '冲刺'>('摸底')
    const [questions, setQuestions] = useState<InterviewQuestion[]>([])
    const [turn, setTurn] = useState(0)
    const [answer, setAnswer] = useState('')
    const [turns, setTurns] = useState<Turn[]>([])
    const [memories, setMemories] = useState<SkillMemory[]>(loadMemories)
    const currentQuestion = questions[turn]
    const maxQuestions = duration === '15' ? 3 : duration === '45' ? 7 : 5
    const report = useMemo(() => createInterviewReport(turns, mode, job, company), [turns, mode, job, company])

    const analyse = () => {
        const next = analyzeJobDescription(jobTitle, jd)
        setJob(next)
        setSkillInput(next.skills.join('，'))
        setPriorityInput(next.priorities.join('\n'))
    }
    const resolvedJob = () => {
        const base = job || analyzeJobDescription(jobTitle, jd)
        return {
            ...base,
            title: jobTitle || base.title,
            description: jd,
            skills: skillInput.trim() ? splitItems(skillInput) : base.skills,
            priorities: priorityInput.trim() ? splitItems(priorityInput) : base.priorities,
        }
    }
    const applyEdits = () => {
        setJob(resolvedJob())
    }
    const saveProfile = () => {
        const profile = resolvedJob()
        const id = `${company.name || '未命名公司'}-${profile.title}`
        const next = [{ id, company, job: profile, updatedAt: new Date().toLocaleDateString('zh-CN') }, ...savedProfiles.filter(item => item.id !== id)].slice(0, 10)
        setSavedProfiles(next)
        saveInterviewProfiles(next)
    }
    const useProfile = (profile: SavedInterviewProfile) => {
        setCompany(profile.company)
        setJobTitle(profile.job.title)
        setJd(profile.job.description)
        setJob(profile.job)
        setSkillInput(profile.job.skills.join('，'))
        setPriorityInput(profile.job.priorities.join('\n'))
    }
    const start = () => {
        const profile = resolvedJob()
        const queue = mode === 'technical' ? getTechnicalQuestions(profile, difficulty) : getHrQuestions()
        setJob(profile)
        setQuestions(queue)
        setTurn(0); setTurns([]); setAnswer(''); setStep('interview')
        const nextDraft = { company, job: profile, mode, duration, difficulty, goal, questions: queue, turn: 0, turns: [], updatedAt: new Date().toLocaleString('zh-CN') }
        saveInterviewDraft(nextDraft); setDraft(nextDraft)
    }
    const remember = (memory: SkillMemory | null) => {
        if (!memory) return
        const next = [memory, ...memories.filter(item => item.skill !== memory.skill)].slice(0, 20)
        setMemories(next); saveMemories(next)
    }
    const complete = (completedTurns: Turn[]) => {
        const completedReport = createInterviewReport(completedTurns, mode, job, company)
        const record = {
            id: `${Date.now()}`,
            completedAt: new Date().toLocaleString('zh-CN'),
            companyName: company.name || '未命名公司',
            jobTitle: job?.title || jobTitle,
            mode,
            duration,
            difficulty,
            goal,
            turns: completedTurns,
            report: completedReport,
        }
        saveInterviewSessions([record, ...loadInterviewSessions()].slice(0, 30))
        clearInterviewDraft(); setDraft(null)
        setStep('report')
    }
    const submit = () => {
        if (!currentQuestion || !answer.trim()) return
        const depth = currentQuestion.id.includes('follow-up') || currentQuestion.id.includes('clarify') ? 1 : 0
        const agentOutput = createAgentTurnOutput(currentQuestion, answer, job, depth)
        const completed = [...turns, { question: currentQuestion, answer, score: agentOutput.assessment.score, assessment: agentOutput.assessment.assessment, decision: agentOutput.reason }]
        agentOutput.memoryCandidates.forEach(remember); setTurns(completed); setAnswer('')
        if (agentOutput.nextAction === 'follow_up' && agentOutput.question && completed.length < maxQuestions) {
            const queue = [...questions.slice(0, turn + 1), agentOutput.question, ...questions.slice(turn + 1)]
            setQuestions(queue); setTurn(turn + 1)
            const nextDraft = { company, job, mode, duration, difficulty, goal, questions: queue, turn: turn + 1, turns: completed, updatedAt: new Date().toLocaleString('zh-CN') }
            saveInterviewDraft(nextDraft); setDraft(nextDraft)
        }
        else if (turn + 1 >= questions.length || completed.length >= maxQuestions) complete(completed)
        else {
            setTurn(turn + 1)
            const nextDraft = { company, job, mode, duration, difficulty, goal, questions, turn: turn + 1, turns: completed, updatedAt: new Date().toLocaleString('zh-CN') }
            saveInterviewDraft(nextDraft); setDraft(nextDraft)
        }
    }
    const resumeDraft = () => {
        if (!draft) return
        setCompany(draft.company); setJob(draft.job); setJobTitle(draft.job?.title || 'Java 后端工程师'); setJd(draft.job?.description || '')
        setMode(draft.mode); setDuration(draft.duration); setDifficulty(draft.difficulty); setGoal(draft.goal)
        setQuestions(draft.questions); setTurn(draft.turn); setTurns(draft.turns); setAnswer(''); setStep('interview')
    }
    const abandonDraft = () => { clearInterviewDraft(); setDraft(null) }

    if (step === 'report') return <main className="mx-auto max-w-screen-md px-4 pb-10 pt-20">
        <section className="rounded-2xl border border-hairline bg-card p-5 dark:border-hairline-dark dark:bg-card-dark"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/15 p-2.5"><BarChart3 className="h-5 w-5 text-primary" /></div><div><p className="text-xs font-medium text-primary">{mode === 'technical' ? '技术面' : 'HR + 项目面'}完成 · {difficulty} · {goal}</p><h2 className="font-display text-2xl text-ink dark:text-ink-dark">本轮岗位匹配度 {report.overallScore}%</h2></div></div><p className="mt-4 text-sm text-body dark:text-body-dark">{report.recommendation}</p></section>
        <section className="mt-4 grid grid-cols-2 gap-3">{report.dimensions.map(item => <article key={item.label} className="rounded-xl border border-hairline bg-canvas p-4 dark:border-hairline-dark dark:bg-canvas-dark"><p className="text-xs text-muted dark:text-muted-dark">{item.label}</p><p className="mt-1 font-display text-2xl text-ink dark:text-ink-dark">{item.score}%</p><p className="mt-1 text-xs text-body dark:text-body-dark">{item.note}</p></article>)}</section>
        {report.risks.length > 0 && <section className="mt-4 rounded-xl bg-red-500/5 p-4"><h3 className="text-sm font-medium text-red-700 dark:text-red-400">风险项</h3><ul className="mt-2 space-y-1 text-xs text-body dark:text-body-dark">{report.risks.map(risk => <li key={risk}>• {risk}</li>)}</ul></section>}
        {report.evidence.length > 0 && <section className="mt-4 rounded-xl border border-hairline bg-canvas p-4 dark:border-hairline-dark dark:bg-canvas-dark"><h3 className="text-sm font-medium text-ink dark:text-ink-dark">评分依据：回答证据</h3><div className="mt-3 space-y-3">{report.evidence.map((item, index) => <article key={`${item.excerpt}-${index}`} className="border-l-2 border-primary/40 pl-3"><p className="text-xs text-primary">关联维度：{item.dimensions.join('、')}</p><p className="mt-1 text-sm text-body dark:text-body-dark">“{item.excerpt}”</p></article>)}</div></section>}
        <section className="mt-4 space-y-3"><h3 className="font-semibold text-ink dark:text-ink-dark">逐题反馈</h3>{turns.map((item, index) => <article key={`${item.question.id}-${index}`} className="rounded-xl border border-hairline bg-canvas p-4 dark:border-hairline-dark dark:bg-canvas-dark"><p className="mb-1 text-xs text-primary">第 {index + 1} 题 · {item.question.focus} · {item.score}/4</p><h4 className="text-sm font-medium text-ink dark:text-ink-dark">{item.question.title}</h4><p className="mt-2 text-sm text-body dark:text-body-dark">{item.assessment}</p><p className="mt-2 text-xs text-muted dark:text-muted-dark">面试官决策：{item.decision}</p></article>)}</section><button onClick={() => setStep('setup')} className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-medium text-white">再进行一次模拟面试</button>
    </main>

    if (step === 'interview' && currentQuestion) return <main className="mx-auto max-w-screen-md px-4 pb-10 pt-20"><div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{mode === 'technical' ? '技术面试官' : 'HR + 项目面试官'}</span><span className="text-xs text-muted dark:text-muted-dark">已回答 {turns.length} / {maxQuestions} 题</span></div><section className="rounded-2xl border border-hairline bg-card p-5 dark:border-hairline-dark dark:bg-card-dark"><div className="flex gap-3"><div className="h-fit rounded-xl bg-primary p-2.5"><Bot className="h-5 w-5 text-white" /></div><div><p className="text-xs font-medium text-primary">重点：{currentQuestion.focus}</p><h2 className="mt-1 font-display text-xl leading-relaxed text-ink dark:text-ink-dark">{currentQuestion.title}</h2><p className="mt-3 text-xs text-muted dark:text-muted-dark">请结合原理、具体场景、职责与可量化结果回答。回答充分时会继续深挖，证据不足时会记录并切换重点。</p></div></div></section><section className="mt-4"><label className="mb-2 block text-sm font-medium text-ink dark:text-ink-dark">你的回答</label><textarea value={answer} onChange={event => setAnswer(event.target.value)} rows={8} placeholder="开始作答。尽量说明背景、方案、取舍和结果…" className="w-full resize-none rounded-xl border border-hairline bg-canvas p-3 text-sm text-ink outline-none focus:border-primary dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark" /><button disabled={!answer.trim()} onClick={submit} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45">提交回答 <ChevronRight className="h-4 w-4" /></button><button onClick={() => setStep('report')} className="mt-3 w-full py-2 text-xs text-muted dark:text-muted-dark">结束本次面试并查看报告</button></section><div className="mt-3 rounded-xl bg-soft p-4 text-xs text-body dark:bg-soft-dark dark:text-body-dark"><Lightbulb className="mr-1 inline h-4 w-4 text-primary" />能力记忆只保存在当前浏览器，可在能力画像页面查看、修正或删除。</div></main>

    if (step === 'setup' && draft) return <main className="mx-auto max-w-screen-md px-4 pb-10 pt-20"><section className="rounded-2xl border border-hairline bg-card p-5 dark:border-hairline-dark dark:bg-card-dark"><p className="text-xs font-medium text-primary">发现未完成的模拟面试</p><h2 className="mt-1 font-display text-2xl text-ink dark:text-ink-dark">继续上次会话？</h2><p className="mt-3 text-sm text-body dark:text-body-dark">{draft.job?.title || 'Java 后端工程师'} · 已完成 {draft.turns.length} 题 · 上次保存于 {draft.updatedAt}</p><button onClick={resumeDraft} className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-medium text-white">继续面试</button><button onClick={abandonDraft} className="mt-2 w-full py-2 text-xs text-muted dark:text-muted-dark">放弃此草稿</button></section></main>

    if (step === 'setup') return <main className="mx-auto max-w-screen-lg px-4 pb-10 pt-20">
        <p className="text-sm font-medium text-primary">为目标岗位准备，而非泛泛刷题</p><h2 className="font-display text-3xl text-ink dark:text-ink-dark">AI 模拟面试官</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><section className="space-y-4 rounded-2xl border border-hairline bg-card p-5 dark:border-hairline-dark dark:bg-card-dark"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><h3 className="font-semibold text-ink dark:text-ink-dark">公司与岗位</h3></div><div className="grid gap-3 sm:grid-cols-2"><Field label="公司名称" value={company.name} onChange={value => setCompany({ ...company, name: value })} placeholder="例如：某互联网公司" /><Field label="行业 / 业务" value={company.industry} onChange={value => setCompany({ ...company, industry: value })} placeholder="例如：支付、电商" /><Field label="公司规模" value={company.size} onChange={value => setCompany({ ...company, size: value })} placeholder="例如：500-1000 人" /><Field label="岗位名称" value={jobTitle} onChange={setJobTitle} placeholder="例如：Java 后端工程师" /></div><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">职位描述（JD）</span><textarea value={jd} onChange={event => setJd(event.target.value)} rows={6} className="w-full resize-none rounded-xl border border-hairline bg-canvas p-3 text-sm text-ink outline-none focus:border-primary dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark" /></label><button onClick={analyse} className="inline-flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" />分析岗位重点</button>{job && <div className="space-y-3 rounded-xl bg-soft p-4 dark:bg-soft-dark"><p className="text-sm font-medium text-ink dark:text-ink-dark">确认岗位重点</p><Field label="重点技能（逗号分隔）" value={skillInput} onChange={setSkillInput} placeholder="Java 并发，Redis" /><label className="block"><span className="mb-1 block text-xs text-muted dark:text-muted-dark">重点考察项（每行一项）</span><textarea value={priorityInput} onChange={event => setPriorityInput(event.target.value)} onBlur={applyEdits} rows={3} className="w-full resize-none rounded-lg border border-hairline bg-canvas p-3 text-xs text-ink outline-none focus:border-primary dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark" /></label><button onClick={saveProfile} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white"><Bookmark className="h-3.5 w-3.5" />保存此岗位配置</button></div>}</section><aside className="space-y-4"><section className="rounded-2xl border border-hairline bg-card p-5 dark:border-hairline-dark dark:bg-card-dark"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /><h3 className="font-semibold text-ink dark:text-ink-dark">面试配置</h3></div><div className="mt-3 space-y-3"><label className="block text-xs text-muted dark:text-muted-dark">面试官<select value={mode} onChange={event => setMode(event.target.value as InterviewMode)} className="mt-1 w-full rounded-lg border border-hairline bg-canvas p-2 text-sm text-ink dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark"><option value="technical">技术面试官</option><option value="hr">HR + 项目面试官</option></select></label><div className="grid grid-cols-3 gap-2"><label className="text-xs text-muted dark:text-muted-dark">时长<select value={duration} onChange={event => setDuration(event.target.value as '15' | '30' | '45')} className="mt-1 w-full rounded-lg border border-hairline bg-canvas p-2 text-xs text-ink dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark"><option value="15">15分</option><option value="30">30分</option><option value="45">45分</option></select></label><label className="text-xs text-muted dark:text-muted-dark">难度<select value={difficulty} onChange={event => setDifficulty(event.target.value as '基础' | '进阶' | '冲刺')} className="mt-1 w-full rounded-lg border border-hairline bg-canvas p-2 text-xs text-ink dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark"><option>基础</option><option>进阶</option><option>冲刺</option></select></label><label className="text-xs text-muted dark:text-muted-dark">目标<select value={goal} onChange={event => setGoal(event.target.value as '摸底' | '冲刺')} className="mt-1 w-full rounded-lg border border-hairline bg-canvas p-2 text-xs text-ink dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark"><option>摸底</option><option>冲刺</option></select></label></div></div><button onClick={start} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-medium text-white">开始模拟面试</button></section><section className="rounded-2xl border border-hairline bg-canvas p-5 dark:border-hairline-dark dark:bg-canvas-dark"><h3 className="font-semibold text-ink dark:text-ink-dark">已保存岗位</h3>{savedProfiles.length ? <div className="mt-3 space-y-2">{savedProfiles.map(profile => <button key={profile.id} onClick={() => useProfile(profile)} className="w-full rounded-lg bg-soft p-2.5 text-left text-xs dark:bg-soft-dark"><span className="font-medium text-ink dark:text-ink-dark">{profile.company.name || '未命名公司'} · {profile.job.title}</span></button>)}</div> : <p className="mt-2 text-xs text-muted dark:text-muted-dark">分析并确认后可保存，下一次一键复用。</p>}</section></aside></div><p className="mt-4 flex items-center gap-2 text-xs text-muted dark:text-muted-dark"><ClipboardList className="h-4 w-4" />配置与能力记忆只保存在当前浏览器。</p>
    </main>

    return <main className="mx-auto max-w-screen-lg px-4 pb-10 pt-20"><div className="mb-6"><p className="text-sm font-medium text-primary">为目标岗位准备，而非泛泛刷题</p><h2 className="font-display text-3xl text-ink dark:text-ink-dark">AI 模拟面试官</h2><p className="mt-2 max-w-2xl text-sm text-body dark:text-body-dark">录入公司与 JD 后，系统识别重点技能。确认岗位配置后，系统从现有题库选择问题。</p></div><div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><section className="space-y-4 rounded-2xl border border-hairline bg-card p-4 sm:p-5 dark:border-hairline-dark dark:bg-card-dark"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><h3 className="font-semibold text-ink dark:text-ink-dark">公司与岗位</h3></div><div className="grid gap-3 sm:grid-cols-2"><Field label="公司名称" value={company.name} onChange={value => setCompany({ ...company, name: value })} placeholder="例如：某互联网公司" /><Field label="行业 / 业务" value={company.industry} onChange={value => setCompany({ ...company, industry: value })} placeholder="例如：支付、电商" /><Field label="公司规模" value={company.size} onChange={value => setCompany({ ...company, size: value })} placeholder="例如：500-1000 人" /><Field label="岗位名称" value={jobTitle} onChange={setJobTitle} placeholder="例如：Java 后端工程师" /></div><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">职位描述（可直接粘贴 JD）</span><textarea value={jd} onChange={event => setJd(event.target.value)} rows={7} placeholder="粘贴工作职责、任职要求、技术栈、业务描述…" className="w-full resize-none rounded-xl border border-hairline bg-canvas p-3 text-sm text-ink outline-none focus:border-primary dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark" /></label><button onClick={analyse} className="flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" />分析岗位重点</button>{job && <div className="space-y-3 rounded-xl bg-soft p-4 dark:bg-soft-dark"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><span className="text-sm font-medium text-ink dark:text-ink-dark">确认岗位重点</span></div><label className="block"><span className="mb-1 block text-xs text-muted dark:text-muted-dark">重点技能（用逗号分隔）</span><input value={skillInput} onChange={event => setSkillInput(event.target.value)} onBlur={applyEdits} className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-primary dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark" /></label><label className="block"><span className="mb-1 block text-xs text-muted dark:text-muted-dark">重点考察项（每行一项）</span><textarea value={priorityInput} onChange={event => setPriorityInput(event.target.value)} onBlur={applyEdits} rows={3} className="w-full resize-none rounded-lg border border-hairline bg-canvas p-3 text-xs text-ink outline-none focus:border-primary dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark" /></label><button onClick={saveProfile} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white"><Bookmark className="h-3.5 w-3.5" />保存此岗位配置</button></div>}</section><aside className="space-y-4"><section className="rounded-2xl border border-hairline bg-card p-5 dark:border-hairline-dark dark:bg-card-dark"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /><h3 className="font-semibold text-ink dark:text-ink-dark">选择面试官</h3></div><div className="mt-4 space-y-2">{([{ id: 'technical', icon: Bot, title: '技术面试官', text: '原理、场景、深挖与技术取舍' }, { id: 'hr', icon: UserRound, title: 'HR + 项目面', text: '项目表达、协作、动机与匹配度' }] as const).map(item => <button key={item.id} onClick={() => setMode(item.id)} className={`w-full rounded-xl border p-3 text-left ${mode === item.id ? 'border-primary bg-primary/10' : 'border-hairline dark:border-hairline-dark'}`}><item.icon className="mb-2 h-4 w-4 text-primary" /><p className="text-sm font-medium text-ink dark:text-ink-dark">{item.title}</p><p className="mt-1 text-xs text-muted dark:text-muted-dark">{item.text}</p></button>)}</div><button onClick={start} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-medium text-white">开始模拟面试</button></section><section className="rounded-2xl border border-hairline bg-canvas p-5 dark:border-hairline-dark dark:bg-canvas-dark"><div className="flex items-center gap-2"><Bookmark className="h-4 w-4 text-primary" /><h3 className="font-semibold text-ink dark:text-ink-dark">已保存岗位</h3></div>{savedProfiles.length ? <div className="mt-3 space-y-2">{savedProfiles.map(profile => <button key={profile.id} onClick={() => useProfile(profile)} className="w-full rounded-lg bg-soft p-2.5 text-left dark:bg-soft-dark"><p className="text-xs font-medium text-ink dark:text-ink-dark">{profile.company.name || '未命名公司'} · {profile.job.title}</p><p className="mt-1 text-xs text-muted dark:text-muted-dark">{profile.updatedAt} 保存</p></button>)}</div> : <p className="mt-3 text-xs text-muted dark:text-muted-dark">确认后可保存岗位配置，下一次一键复用。</p>}</section><section className="rounded-2xl border border-hairline bg-canvas p-5 dark:border-hairline-dark dark:bg-canvas-dark"><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary" /><h3 className="font-semibold text-ink dark:text-ink-dark">个人能力记忆</h3></div>{memories.length ? <div className="mt-3 space-y-2">{memories.slice(0, 3).map(memory => <div key={memory.id} className="rounded-lg bg-soft p-2.5 dark:bg-soft-dark"><p className="text-xs font-medium text-ink dark:text-ink-dark">{memory.skill}</p><p className="mt-1 text-xs text-muted dark:text-muted-dark">{memory.level === 'weak' ? '需要重点补强' : '仍需补充证据'}</p></div>)}</div> : <p className="mt-3 text-xs text-muted dark:text-muted-dark">完成面试后，回答薄弱或证据不足的技能会记录在这里。</p>}</section></aside></div><p className="mt-4 flex items-center gap-2 text-xs text-muted dark:text-muted-dark"><ClipboardList className="h-4 w-4" />MVP 使用本地题库检索和规则化评估；配置与能力记忆只保存在当前浏览器。</p></main>
}
