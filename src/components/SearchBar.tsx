import { useState, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Globe, CircleDot } from 'lucide-react'

type SearchEngine = 'google' | 'baidu'

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
      <div className="flex items-center rounded-xl p-1.5 shadow-lg border border-border bg-card">
        {/* 搜索引擎选择器 */}
        <Select
          value={searchEngine}
          onValueChange={(value: SearchEngine) => setSearchEngine(value)}
        >
          <SelectTrigger className="w-[110px] h-9 border-0 bg-muted/50 rounded-lg focus:ring-0 focus:ring-offset-0 px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-[110px]">
            <SelectItem value="google" className="cursor-pointer pl-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Google</span>
              </div>
            </SelectItem>
            <SelectItem value="baidu" className="cursor-pointer pl-3">
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4" />
                <span>百度</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 分隔线 */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* 搜索输入框 */}
        <div className="flex-1 flex items-center">
          <Input
            type="text"
            placeholder={`搜索 ${searchEngines[searchEngine].name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />
          <button
            onClick={handleSearch}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
