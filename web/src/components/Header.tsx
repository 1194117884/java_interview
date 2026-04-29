import { Search, ChevronLeft } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useAppStore } from '../stores/appStore'

interface HeaderProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
}

export function Header({ title = 'Java面试宝典', showBack = false, onBack }: HeaderProps) {
  const { setSearchOpen } = useAppStore()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-canvas dark:bg-canvas-dark border-b border-hairline dark:border-hairline-dark">
      <div className="flex items-center justify-between h-14 px-4 max-w-screen-lg mx-auto">
        <div className="flex items-center gap-2">
          {showBack && onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-lg transition-colors hover:bg-soft dark:hover:bg-soft-dark"
              aria-label="返回"
            >
              <ChevronLeft className="w-5 h-5 text-ink dark:text-ink-dark" />
            </button>
          )}
          <h1 className="font-display text-lg font-medium text-ink dark:text-ink-dark tracking-tight">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg transition-colors hover:bg-soft dark:hover:bg-soft-dark"
            aria-label="搜索"
          >
            <Search className="w-5 h-5 text-ink dark:text-ink-dark" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
