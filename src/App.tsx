import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { WidgetGrid } from '@/components/WidgetGrid'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { HelpPage } from '@/components/HelpPage'
import { HelpCircle } from 'lucide-react'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'help'>('home')

  if (currentPage === 'help') {
    return <HelpPage onBack={() => setCurrentPage('home')} />
  }

  return (
    <div className="h-screen overflow-hidden bg-neutral-50/50 dark:bg-background flex flex-col transition-colors duration-300">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500" />

      <ThemeToggle />
      <SettingsDrawer />

      {/* 帮助按钮 - 右下角 */}
      <button
        onClick={() => setCurrentPage('help')}
        className="fixed bottom-6 right-6 z-50 h-10 w-10 flex items-center justify-center rounded-xl 
          bg-card border border-border/50 shadow-sm
          hover:shadow-md hover:scale-105 active:scale-95 
          transition-all duration-300 ease-out
          group"
        aria-label="帮助"
      >
        <HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      {/* SearchBar 固定区域 */}
      <div className="flex-shrink-0 flex justify-center pt-[12vh] pb-4 px-4 relative z-10">
        <SearchBar />
      </div>

      {/* WidgetGrid 分页区域 */}
      <div className="flex-1 overflow-hidden relative z-10">
        <WidgetGrid />
      </div>
    </div>
  )
}

export default App
