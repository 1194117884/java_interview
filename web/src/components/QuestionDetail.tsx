import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { useAppStore } from '../stores/appStore'

interface Question {
  id: string
  title: string
  content: string
}

interface CategoryData {
  category: string
  questions: Question[]
}

export function QuestionDetail() {
  const { categoryId, questionId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<CategoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const setLastQuestion = useAppStore(s => s.setLastQuestion)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/data/content/${categoryId}.json`)
        const categoryData = await response.json()
        setData(categoryData)
      } catch (e) {
        console.error('Failed to load category:', categoryId)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [categoryId])

  const currentIndex = data?.questions.findIndex(q => q.id === questionId) ?? -1
  const currentQuestion = data?.questions[currentIndex]

  // Save last viewed question to store
  useEffect(() => {
    if (!loading && currentQuestion) {
      setLastQuestion({
        categoryId: categoryId!,
        questionId: questionId!,
        title: currentQuestion.title
      })
    }
  }, [loading, currentQuestion, setLastQuestion])
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < (data?.questions.length ?? 0) - 1

  const goToPrev = () => {
    if (hasPrev && data) {
      const prev = data.questions[currentIndex - 1]
      navigate(`/question/${categoryId}/${prev.id}`, { replace: true })
    }
  }

  const goToNext = () => {
    if (hasNext && data) {
      const next = data.questions[currentIndex + 1]
      navigate(`/question/${categoryId}/${next.id}`, { replace: true })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted dark:text-muted-dark">加载中...</div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted dark:text-muted-dark">题目未找到</div>
      </div>
    )
  }

  return (
    <div className="pb-24">
      {/* Question Content */}
      <div className="bg-canvas dark:bg-canvas-dark">
        <MarkdownRenderer content={currentQuestion.content} />
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-canvas dark:bg-canvas-dark border-t border-hairline dark:border-hairline-dark safe-area-pb">
        <div className="flex items-center justify-between h-14 px-4 max-w-screen-lg mx-auto">
          <button
            onClick={goToPrev}
            disabled={!hasPrev}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-soft dark:hover:bg-soft-dark"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">上一题</span>
          </button>

          <span className="text-sm text-muted dark:text-muted-dark">
            {currentIndex + 1} / {data.questions.length}
          </span>

          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-soft dark:hover:bg-soft-dark"
          >
            <span className="text-sm font-medium">下一题</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
