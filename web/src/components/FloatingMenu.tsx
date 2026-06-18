import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, Shuffle, Search, Sun, Moon } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useTheme } from '../hooks/useTheme'

export function FloatingMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { setSearchOpen } = useAppStore()
  const { theme, toggleTheme } = useTheme()

  const close = () => setOpen(false)

  const items = [
    {
      icon: Shuffle,
      label: '随机面试题',
      onClick: () => { navigate('/random-quiz'); close() },
    },
    {
      icon: Search,
      label: '搜索',
      onClick: () => { setSearchOpen(true); close() },
    },
    {
      icon: theme === 'dark' ? Sun : Moon,
      label: theme === 'dark' ? '浅色模式' : '深色模式',
      onClick: () => { toggleTheme(); close() },
    },
  ]

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={close} />
      )}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col items-end gap-2">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex items-center gap-3 px-4 py-3 bg-card dark:bg-card-dark rounded-xl shadow-lg border border-hairline dark:border-hairline-dark hover:bg-soft dark:hover:bg-soft-dark transition-colors whitespace-nowrap"
              >
                <item.icon className="w-5 h-5 text-primary" />
                <span className="text-sm text-ink dark:text-ink-dark">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
          aria-label={open ? '关闭菜单' : '打开菜单'}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </>
  )
}
