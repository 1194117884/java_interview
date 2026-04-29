import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  currentCategory: string | null
  setCurrentCategory: (category: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
      currentCategory: null,
      setCurrentCategory: (category) => set({ currentCategory: category })
    }),
    {
      name: 'java-interview-storage',
      partialize: (state) => ({ theme: state.theme })
    }
  )
)
