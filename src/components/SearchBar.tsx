import { useState, useEffect, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { BrandGoogle, BrandBaidu } from '@/svg/icon-collection'
import { db } from '@/lib/db'

type SearchEngine = 'google' | 'baidu'

const SEARCH_ENGINE_KEY = 'search-engine'

const searchEngines: Record<SearchEngine, { name: string; url: string }> = {
  google: {
    name: 'Google',
    url: 'https://www.google.com/search?q=',
  },
  baidu: {
    name: '百度',
    url: 'https://www.baidu.com/s?wd=',
  },
}

export function SearchBar() {
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('google')
  const [searchQuery, setSearchQuery] = useState('')

  // 从 IndexedDB 加载保存的搜索引擎设置
  useEffect(() => {
    db.settings.get(SEARCH_ENGINE_KEY).then((saved) => {
      if (saved && (saved === 'google' || saved === 'baidu')) {
        setSearchEngine(saved)
      }
    })
  }, [])

  // 切换搜索引擎时保存到 IndexedDB
  const handleEngineChange = (value: SearchEngine) => {
    setSearchEngine(value)
    db.settings.set(SEARCH_ENGINE_KEY, value)
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    const url = searchEngines[searchEngine].url + encodeURIComponent(searchQuery.trim())
    window.location.href = url
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center rounded-xl p-1.5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-border/50 bg-card">
        {/* 搜索引擎选择器 */}
        <Select
          value={searchEngine}
          onValueChange={handleEngineChange}
        >
          <SelectTrigger className="w-[130px] h-9 border-0 bg-transparent hover:bg-muted/50 rounded-lg focus:ring-0 focus:ring-offset-0 px-3 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-[130px]">
            <SelectItem value="google" className="cursor-pointer">
              <div className="flex items-center gap-2.5">
                <BrandGoogle className="w-4 h-4 text-muted-foreground" />
                <span>Google</span>
              </div>
            </SelectItem>
            <SelectItem value="baidu" className="cursor-pointer">
              <div className="flex items-center gap-2.5">
                <BrandBaidu className="w-4 h-4 text-muted-foreground" />
                <span>百度</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 分隔线 */}
        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* 搜索输入框 */}
        <div className="flex-1 flex items-center">
          <Input
            type="text"
            placeholder={`搜索 ${searchEngines[searchEngine].name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/50"
          />
          <button
            onClick={handleSearch}
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/90 text-primary-foreground hover:bg-primary hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
