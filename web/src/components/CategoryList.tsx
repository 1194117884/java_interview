import { useState } from 'react'
import { ChevronRight, ChevronDown, Circle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import categoryIndex from '../data/index.json'

interface Category {
  id: string
  name: string
  count: number
  order: number
}

interface Question {
  id: string
  title: string
}

interface CategoryData {
  category: string
  questions: Question[]
}

export function CategoryList() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [categoryData, setCategoryData] = useState<Record<string, CategoryData>>({})
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  const toggleCategory = async (categoryId: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
      // Load category data if not cached
      if (!categoryData[categoryId]) {
        setLoadingCategories(prev => new Set(prev).add(categoryId))
        try {
          const response = await fetch(`/data/content/${categoryId}.json`)
          const data = await response.json()
          setCategoryData(prev => ({ ...prev, [categoryId]: data }))
        } catch (e) {
          console.error('Failed to load category:', categoryId)
        } finally {
          setLoadingCategories(prev => {
            const next = new Set(prev)
            next.delete(categoryId)
            return next
          })
        }
      }
    }
    setExpanded(newExpanded)
  }

  const handleQuestionClick = (categoryId: string, questionId: string) => {
    navigate(`/question/${categoryId}/${questionId}`)
  }

  return (
    <div className="space-y-2">
      {categoryIndex.categories.map((category: Category) => {
        const isExpanded = expanded.has(category.id)
        const data = categoryData[category.id]
        const isLoading = loadingCategories.has(category.id)

        return (
          <div
            key={category.id}
            className="bg-card dark:bg-card-dark rounded-xl overflow-hidden"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-soft/50 dark:hover:bg-soft-dark/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted dark:text-muted-dark" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted dark:text-muted-dark" />
                )}
                <span className="font-medium text-ink dark:text-ink-dark">
                  {category.name}
                </span>
              </div>
              <span className="text-sm text-muted dark:text-muted-dark bg-soft dark:bg-soft-dark px-2 py-0.5 rounded-full">
                {category.count}
              </span>
            </button>

            {/* Question List */}
            {isExpanded && data && (
              <div className="border-t border-hairline dark:border-hairline-dark">
                {data.questions.map((q: Question) => (
                  <button
                    key={q.id}
                    onClick={() => handleQuestionClick(category.id, q.id)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-soft/50 dark:hover:bg-soft-dark/50 transition-colors text-left border-b border-hairline/50 dark:border-hairline-dark/50 last:border-b-0"
                  >
                    <Circle className="w-2 h-2 mt-2 text-primary flex-shrink-0 fill-primary" />
                    <span className="text-sm text-body dark:text-body-dark leading-relaxed line-clamp-2">
                      {q.title}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Loading State */}
            {isExpanded && !data && isLoading && (
              <div className="px-4 py-4 text-center text-muted dark:text-muted-dark">
                加载中...
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
