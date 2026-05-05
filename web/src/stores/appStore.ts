import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LastQuestion {
  categoryId: string
  questionId: string
  title: string
}

interface AppState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  currentCategory: string | null
  setCurrentCategory: (category: string | null) => void
  expandedCategories: string[]
  setExpandedCategories: (categories: string[]) => void
  scrollPosition: number
  setScrollPosition: (position: number) => void
  lastQuestion: LastQuestion | null
  setLastQuestion: (question: LastQuestion | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
      currentCategory: null,
      setCurrentCategory: (category) => set({ currentCategory: category }),
      expandedCategories: [],
      setExpandedCategories: (categories) => set({ expandedCategories: categories }),
      scrollPosition: 0,
      setScrollPosition: (position) => set({ scrollPosition: position }),
      lastQuestion: null,
      setLastQuestion: (question) => set({ lastQuestion: question })
    }),
    {
      name: 'java-interview-storage',
      partialize: (state) => ({
        theme: state.theme,
        expandedCategories: state.expandedCategories,
        scrollPosition: state.scrollPosition,
        lastQuestion: state.lastQuestion
      })
    }
  )
)
