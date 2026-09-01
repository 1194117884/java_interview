import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { CategoryList } from './components/CategoryList'
import { QuestionDetail } from './components/QuestionDetail'
import { RandomQuiz } from './components/RandomQuiz'
import { SearchModal } from './components/SearchModal'
import { FloatingMenu } from './components/FloatingMenu'
import { InterviewStudio } from './components/InterviewStudio'
import { SkillMemoryProfile } from './components/SkillMemoryProfile'
import { InterviewHistory } from './components/InterviewHistory'
import { CompanyProfiles } from './components/CompanyProfiles'
import { useTheme } from './hooks/useTheme'

function Home() {
  return (
    <div className="pt-16 pb-4 px-4 max-w-screen-lg mx-auto">
      <CategoryList />
    </div>
  )
}

function Detail() {
  return (
    <div className="pt-16 pb-4 px-4 max-w-screen-lg mx-auto">
      <QuestionDetail />
    </div>
  )
}

function Interview() {
  return <InterviewStudio />
}

function SkillMemory() {
  return <SkillMemoryProfile />
}

function History() {
  return <InterviewHistory />
}

function Companies() {
  return <CompanyProfiles />
}

export default function App() {
  useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const isRandomQuiz = location.pathname === '/random-quiz'
  const isInterview = location.pathname === '/ai-interview'
  const isSkillMemory = location.pathname === '/skill-memory'
  const isHistory = location.pathname === '/interview-history'
  const isCompanies = location.pathname === '/company-profiles'
  const isDetail = location.pathname.startsWith('/question/') || isRandomQuiz || isInterview || isSkillMemory || isHistory || isCompanies
  const categoryMatch = location.pathname.match(/\/question\/([^/]+)/)
  const currentCategory = categoryMatch ? decodeURIComponent(categoryMatch[1]) : null

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark">
      <Header
        title={isInterview ? 'AI 模拟面试' : isCompanies ? '公司与岗位' : isSkillMemory ? '能力画像' : isHistory ? '历史报告' : isRandomQuiz ? '随机面试题' : isDetail ? currentCategory || '题目详情' : 'Java面试宝典'}
        showBack={isDetail}
        onBack={() => navigate(-1)}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/question/:categoryId/:questionId" element={<Detail />} />
        <Route path="/random-quiz" element={<RandomQuiz />} />
        <Route path="/ai-interview" element={<Interview />} />
        <Route path="/skill-memory" element={<SkillMemory />} />
        <Route path="/interview-history" element={<History />} />
        <Route path="/company-profiles" element={<Companies />} />
      </Routes>
      <SearchModal />
      {location.pathname === '/' && <FloatingMenu />}
    </div>
  )
}
