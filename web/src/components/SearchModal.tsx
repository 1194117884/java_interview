import { useEffect, useRef } from 'react'
import { Search, X, FileText } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useSearch } from '../hooks/useSearch'
import { useNavigate } from 'react-router-dom'

export function SearchModal() {
  const { searchOpen, setSearchOpen } = useAppStore()
  const { query, setQuery, results } = useSearch()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [setSearchOpen])

  const handleSelect = (categoryId: string, questionId: string) => {
    setSearchOpen(false)
    setQuery('')
    navigate(`/question/${categoryId}/${questionId}`)
  }

  if (!searchOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="absolute top-20 left-4 right-4 max-w-lg mx-auto bg-canvas dark:bg-canvas-dark rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline dark:border-hairline-dark">
          <Search className="w-5 h-5 text-muted dark:text-muted-dark" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索面试题..."
            className="flex-1 bg-transparent text-ink dark:text-ink-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none text-base"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded hover:bg-soft dark:hover:bg-soft-dark"
          >
            <X className="w-5 h-5 text-muted dark:text-muted-dark" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-hairline dark:divide-hairline-dark">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result.categoryId, result.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-soft dark:hover:bg-soft-dark transition-colors text-left"
                >
                  <FileText className="w-5 h-5 text-muted dark:text-muted-dark mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink dark:text-ink-dark truncate">
                      {result.title}
                    </div>
                    <div className="text-xs text-muted dark:text-muted-dark mt-0.5">
                      {result.category}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="px-4 py-8 text-center text-muted dark:text-muted-dark">
              未找到相关题目
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-muted dark:text-muted-dark">
              输入关键词搜索面试题
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
