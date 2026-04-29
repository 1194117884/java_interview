import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors hover:bg-hairline dark:hover:bg-hairline-dark"
      aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-ink dark:text-ink-dark" />
      ) : (
        <Moon className="w-5 h-5 text-ink dark:text-ink-dark" />
      )}
    </button>
  )
}
