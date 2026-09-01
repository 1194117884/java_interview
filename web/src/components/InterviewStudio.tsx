import { useMemo, useState } from 'react'
import { BarChart3, Bot, Building2, CheckCircle2, ChevronRight, ClipboardList, Lightbulb, MessageSquare, ShieldAlert, Sparkles, UserRound } from 'lucide-react'
import {
  analyzeJobDescription,
  assessAnswer,
  createMemory,
  getHrQuestions,
  getTechnicalQuestions,
  type CompanyProfile,
  type InterviewMode,
  type InterviewQuestion,
  type JobProfile,
  type SkillMemory,
} from '../lib/interviewEngine'

type Step = 'setup' | 'interview' | 'report'

const emptyCompany: CompanyProfile = { name: '', industry: '', size: '', stage: '', culture: '' }
const storageKey = 'java-interview-ai-memory'

function loadMemories(): SkillMemory[] {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]') } catch { return [] }
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">{label}</span><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-hairline dark:border-hairline-dark bg-canvas dark:bg-canvas-dark px-3 py-2.5 text-sm text-ink dark:text-ink-dark outline-none focus:border-primary" /></label>
}

export function InterviewStudio() {
  const [step, setStep] = useState<Step>('setup')
  const [company, setCompany] = useState<CompanyProfile>(emptyCompany)
  const [jobTitle, setJobTitle] = useState('Java 后端工程师')
  const [jd, setJd] = useState('')
  const [job, setJob] = useState<JobProfile | null>(null)
  const [mode, setMode] = useState<InterviewMode>('technical')
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [turn, setTurn] = useState(0)
  const [answer, setAnswer] = useState('')
  const [turns, setTurns] = useState<Array<{ question: InterviewQuestion; answer: string; score: number; assessment: string }>>([])
  const [memories, setMemories] = useState<SkillMemory[]>(loadMemories)

  const currentQuestion = questions[turn]
  const score = useMemo(() => turns.length ? Math.round(turns.reduce((total, item) => total + item.score, 0) / (turns.length * 4) * 100) : 0, [turns])

  const analyse = () => setJob(analyzeJobDescription(jobTitle, jd))
  const start = () => {
    const profile = job || analyzeJobDescription(jobTitle, jd)
    setJob(profile)
    setQuestions(mode === 'technical' ? getTechnicalQuestions(profile) : getHrQuestions())
    setTurn(0); setTurns([]); setAnswer(''); setStep('interview')
  }
  const submit = () => {
    if (!currentQuestion || !answer.trim()) return
    const result = assessAnswer(answer, currentQuestion)
    const memory = createMemory(currentQuestion, answer)
    if (memory) {
      const next = [memory, ...memories.filter(item => item.skill !== memory.skill)].slice(0, 20)
      setMemories(next); localStorage.setItem(storageKey, JSON.stringify(next))
    }
    setTurns([...turns, { question: currentQuestion, answer, score: result.score, assessment: result.assessment }])
    setAnswer('')
    if (turn + 1 >= Math.min(questions.length, 5)) setStep('report')
    else setTurn(turn + 1)
  }

  if (step === 'report') return <main className="pt-20 pb-10 px-4 max-w-screen-md mx-auto">
    <section className="rounded-2xl border border-hairline dark:border-hairline-dark bg-card dark:bg-card-dark p-5">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/15 p-2.5"><BarChart3 className="w-5 h-5 text-primary" /></div><div><p className="text-xs text-primary font-medium">{mode === 'technical' ? '技术面' : 'HR + 项目面'}完成</p><h2 className="font-display text-2xl text-ink dark:text-ink-dark">本轮岗位匹配度 {score}%</h2></div></div>
      <p className="mt-4 text-sm text-body dark:text-body-dark">本报告基于本地规则引擎生成，已将低置信或不完整回答记录在你的个人能力记忆中，后续真实模型接入时可直接使用这些数据。</p>
    </section>
    <section className="mt-4 space-y-3"><h3 className="font-semibold text-ink dark:text-ink-dark">逐题反馈</h3>{turns.map((item, index) => <article key={item.question.id} className="rounded-xl border border-hairline dark:border-hairline-dark bg-canvas dark:bg-canvas-dark p-4"><p className="text-xs text-primary mb-1">第 {index + 1} 题 · {item.question.focus}</p><h4 className="text-sm font-medium text-ink dark:text-ink-dark">{item.question.title}</h4><p className="mt-2 text-sm text-body dark:text-body-dark">{item.assessment}</p></article>)}</section>
    <button onClick={() => setStep('setup')} className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-medium text-white">再进行一次模拟面试</button>
  </main>

  if (step === 'interview' && currentQuestion) return <main className="pt-20 pb-10 px-4 max-w-screen-md mx-auto">
    <div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{mode === 'technical' ? '技术面试官' : 'HR + 项目面试官'}</span><span className="text-xs text-muted dark:text-muted-dark">第 {turn + 1} / {Math.min(questions.length, 5)} 题</span></div>
    <section className="rounded-2xl border border-hairline dark:border-hairline-dark bg-card dark:bg-card-dark p-5"><div className="flex gap-3"><div className="rounded-xl bg-primary p-2.5 h-fit"><Bot className="w-5 h-5 text-white" /></div><div><p className="text-xs text-primary font-medium">重点：{currentQuestion.focus}</p><h2 className="mt-1 font-display text-xl leading-relaxed text-ink dark:text-ink-dark">{currentQuestion.title}</h2><p className="mt-3 text-xs text-muted dark:text-muted-dark">请结合原理、具体场景、你的职责与可量化结果回答。核心技能答对后，面试官会继续深挖。</p></div></div></section>
    <section className="mt-4"><label className="mb-2 block text-sm font-medium text-ink dark:text-ink-dark">你的回答</label><textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={8} placeholder="开始作答。尽量说明背景、方案、取舍和结果…" className="w-full resize-none rounded-xl border border-hairline dark:border-hairline-dark bg-canvas dark:bg-canvas-dark p-3 text-sm text-ink dark:text-ink-dark outline-none focus:border-primary" /><button disabled={!answer.trim()} onClick={submit} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45">提交回答 <ChevronRight className="w-4 h-4" /></button></section>
    <div className="mt-5 rounded-xl bg-soft dark:bg-soft-dark p-4 text-xs text-body dark:text-body-dark"><Lightbulb className="mr-1 inline w-4 h-4 text-primary" />能力记忆仅保存在当前浏览器中。你可在设置页查看本次沉淀的薄弱点。</div>
  </main>

  return <main className="pt-20 pb-10 px-4 max-w-screen-lg mx-auto">
    <div className="mb-6"><p className="text-sm text-primary font-medium">为目标岗位准备，而非泛泛刷题</p><h2 className="font-display text-3xl text-ink dark:text-ink-dark">AI 模拟面试官</h2><p className="mt-2 max-w-2xl text-sm text-body dark:text-body-dark">录入公司与 JD 后，系统识别重点技能，从现有题库选择问题，并把需要加强的能力沉淀为你专属的记忆。</p></div>
    <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
      <section className="space-y-4 rounded-2xl border border-hairline dark:border-hairline-dark bg-card dark:bg-card-dark p-4 sm:p-5">
        <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><h3 className="font-semibold text-ink dark:text-ink-dark">公司与岗位</h3></div>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="公司名称" value={company.name} onChange={value => setCompany({ ...company, name: value })} placeholder="例如：某互联网公司" /><Field label="行业 / 业务" value={company.industry} onChange={value => setCompany({ ...company, industry: value })} placeholder="例如：支付、电商" /><Field label="公司规模" value={company.size} onChange={value => setCompany({ ...company, size: value })} placeholder="例如：500-1000 人" /><Field label="岗位名称" value={jobTitle} onChange={setJobTitle} placeholder="例如：Java 后端工程师" /></div>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">职位描述（可直接粘贴 Boss / 智联 JD）</span><textarea value={jd} onChange={e => setJd(e.target.value)} rows={7} placeholder="粘贴工作职责、任职要求、技术栈、业务描述…" className="w-full resize-none rounded-xl border border-hairline dark:border-hairline-dark bg-canvas dark:bg-canvas-dark p-3 text-sm text-ink dark:text-ink-dark outline-none focus:border-primary" /></label>
        <button onClick={analyse} className="flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="w-4 h-4" />分析岗位重点</button>
        {job && <div className="rounded-xl bg-soft dark:bg-soft-dark p-4"><div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-ink dark:text-ink-dark">JD 分析结果</span></div><div className="mt-3 flex flex-wrap gap-2">{job.skills.map(skill => <span key={skill} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{skill}</span>)}</div><ul className="mt-3 space-y-1.5 text-xs text-body dark:text-body-dark">{job.priorities.map(item => <li key={item}>• {item}</li>)}</ul></div>}
      </section>
      <aside className="space-y-4"><section className="rounded-2xl border border-hairline dark:border-hairline-dark bg-card dark:bg-card-dark p-5"><div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /><h3 className="font-semibold text-ink dark:text-ink-dark">选择面试官</h3></div><div className="mt-4 space-y-2">{([{ id: 'technical', icon: Bot, title: '技术面试官', text: '原理、场景、深挖与技术取舍' }, { id: 'hr', icon: UserRound, title: 'HR + 项目面', text: '项目表达、协作、动机与匹配度' }] as const).map(item => <button key={item.id} onClick={() => setMode(item.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${mode === item.id ? 'border-primary bg-primary/10' : 'border-hairline dark:border-hairline-dark'}`}><item.icon className="mb-2 w-4 h-4 text-primary" /><p className="text-sm font-medium text-ink dark:text-ink-dark">{item.title}</p><p className="mt-1 text-xs text-muted dark:text-muted-dark">{item.text}</p></button>)}</div><button onClick={start} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-medium text-white">开始模拟面试</button></section>
        <section className="rounded-2xl border border-hairline dark:border-hairline-dark bg-canvas dark:bg-canvas-dark p-5"><div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-primary" /><h3 className="font-semibold text-ink dark:text-ink-dark">个人能力记忆</h3></div>{memories.length ? <div className="mt-3 space-y-2">{memories.slice(0, 3).map(memory => <div key={memory.id} className="rounded-lg bg-soft dark:bg-soft-dark p-2.5"><p className="text-xs font-medium text-ink dark:text-ink-dark">{memory.skill}</p><p className="mt-1 text-xs text-muted dark:text-muted-dark">{memory.level === 'weak' ? '需要重点补强' : '仍需补充证据'}</p></div>)}</div> : <p className="mt-3 text-xs leading-relaxed text-muted dark:text-muted-dark">完成面试后，回答薄弱或证据不足的技能会记录在这里。数据只保存在你的浏览器。</p>}</section></aside>
    </div>
    <p className="mt-4 flex items-center gap-2 text-xs text-muted dark:text-muted-dark"><ClipboardList className="w-4 h-4" />MVP 使用本地题库检索和规则化评估；模型服务接入后可替换为真实 Agent 编排。</p>
  </main>
}
