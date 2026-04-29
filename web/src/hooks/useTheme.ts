import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'

export function useTheme() {
  const { theme, setTheme } = useAppStore()

  useEffect(() => {
    // Check system preference on mount
    if (!theme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggleTheme, setTheme }
}
