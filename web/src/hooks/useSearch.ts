import { useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import searchIndex from '../data/search-index.json'

interface SearchResult {
  id: string
  title: string
  category: string
  categoryId: string
  preview: string
}

const fuse = new Fuse(searchIndex, {
  keys: ['title', 'category', 'preview'],
  threshold: 0.3,
  includeScore: true
})

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    if (query.trim()) {
      const searchResults = fuse.search(query.trim()).slice(0, 10)
      setResults(searchResults.map(r => r.item as SearchResult))
    } else {
      setResults([])
    }
  }, [query])

  return { query, setQuery, results }
}
