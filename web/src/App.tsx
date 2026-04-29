import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { CategoryList } from './components/CategoryList'
import { QuestionDetail } from './components/QuestionDetail'
import { SearchModal } from './components/SearchModal'
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

export default function App() {
  useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const isDetail = location.pathname.startsWith('/question/')
  const categoryMatch = location.pathname.match(/\/question\/([^/]+)/)
  const currentCategory = categoryMatch ? decodeURIComponent(categoryMatch[1]) : null

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark">
      <Header
        title={isDetail ? currentCategory || '题目详情' : 'Java面试宝典'}
        showBack={isDetail}
        onBack={() => navigate('/')}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/question/:categoryId/:questionId" element={<Detail />} />
      </Routes>
      <SearchModal />
    </div>
  )
}
