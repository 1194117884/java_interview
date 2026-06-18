import { useEffect } from 'react'
import { Shuffle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import searchIndex from '../data/search-index.json'
import categoryIndex from '../data/index.json'
import { useAppStore, type RandomQuizItem } from '../stores/appStore'

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function pickRandomQuestions(count: number): RandomQuizItem[] {
  const byCategory = new Map<string, RandomQuizItem[]>()
  for (const item of searchIndex as RandomQuizItem[]) {
    if (!byCategory.has(item.categoryId)) {
      byCategory.set(item.categoryId, [])
    }
    byCategory.get(item.categoryId)!.push(item)
  }

  const richCategories = categoryIndex.categories.filter(
    c => (byCategory.get(c.id)?.length || 0) >= 2,
  )
  const poorCategories = categoryIndex.categories.filter(c => {
    const len = byCategory.get(c.id)?.length || 0
    return len > 0 && len < 2
  })

  const shuffled = shuffle(richCategories)
  const result: RandomQuizItem[] = []

  for (const category of shuffled) {
    if (result.length >= count) break
    const questions = shuffle(byCategory.get(category.id)!)
    const take = Math.min(3, count - result.length, questions.length)
    result.push(...questions.slice(0, take))
  }

  if (result.length < count) {
    const fallback = shuffle(poorCategories)
    for (const category of fallback) {
      if (result.length >= count) break
      const questions = shuffle(byCategory.get(category.id)!)
      const take = Math.min(1, count - result.length, questions.length)
      result.push(...questions.slice(0, take))
    }
  }

  return result
}

const TOTAL = 15

export function RandomQuiz() {
  const navigate = useNavigate()
  const storedQuestions = useAppStore(s => s.randomQuizQuestions)
  const setStoredQuestions = useAppStore(s => s.setRandomQuizQuestions)

  useEffect(() => {
    if (storedQuestions.length === 0) {
      setStoredQuestions(pickRandomQuestions(TOTAL))
    }
  }, [])

  const questions = storedQuestions.length > 0 ? storedQuestions : pickRandomQuestions(TOTAL)

  return (
    <div className="pt-16 pb-4 px-4 max-w-screen-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-ink dark:text-ink-dark">
          随机面试题 {TOTAL}道
        </h1>
        <button
          onClick={() => setStoredQuestions(pickRandomQuestions(TOTAL))}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
        >
          <Shuffle className="w-4 h-4" />
          换一批
        </button>
      </div>
      <div className="space-y-2">
        {questions.map((q, i) => (
          <button
            key={`${q.categoryId}-${q.id}`}
            onClick={() => navigate(`/question/${q.categoryId}/${q.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-card dark:bg-card-dark rounded-xl hover:bg-soft/50 dark:hover:bg-soft-dark/50 transition-colors text-left"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
              {i + 1}
            </span>
            <span className="flex-1 text-sm text-body dark:text-body-dark leading-relaxed line-clamp-2">
              {q.title}
            </span>
            <span className="flex-shrink-0 text-xs text-muted dark:text-muted-dark bg-soft dark:bg-soft-dark px-2 py-0.5 rounded-full">
              {q.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
