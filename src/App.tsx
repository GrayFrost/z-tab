import { useState, useEffect } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { WidgetGrid } from '@/components/WidgetGrid'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SettingsDrawer } from '@/components/SettingsDrawer'
import { HelpPage } from '@/components/HelpPage'
import { HelpCircle } from 'lucide-react'
import { db } from '@/lib/db'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'help'>('home')
  const [autoHideButtons, setAutoHideButtons] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

  // 从 IndexedDB 加载设置
  useEffect(() => {
    db.settings.get('auto-hide-buttons').then((saved) => {
      if (typeof saved === 'boolean') {
        setAutoHideButtons(saved)
      }
      setIsSettingsLoaded(true)
    })
  }, [])

  // 按钮是否可见：设置未加载时隐藏，不自动隐藏时始终显示，自动隐藏时只有悬浮才显示
  const buttonsVisible = isSettingsLoaded && (!autoHideButtons || isHovering)

  if (currentPage === 'help') {
    return <HelpPage onBack={() => setCurrentPage('home')} />
  }

  return (
    <div className="h-screen overflow-hidden bg-neutral-50/50 dark:bg-background flex flex-col transition-colors duration-300">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500" />

      {/* 右侧按钮悬浮检测区域 */}
      <div
        className="fixed top-0 right-0 w-20 h-full z-40"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      />

      {/* 右侧按钮组 */}
      <div
        className={`fixed right-6 z-50 flex flex-col gap-3 transition-all duration-300 ${
          buttonsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* 主题切换按钮 - 顶部 */}
        <div className="mt-6">
          <ThemeToggle />
        </div>

        {/* 设置按钮 */}
        <SettingsDrawer
          autoHideButtons={autoHideButtons}
          onAutoHideButtonsChange={setAutoHideButtons}
        />
      </div>

      {/* 帮助按钮 - 右下角 */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          buttonsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <button
          onClick={() => setCurrentPage('help')}
          className="h-10 w-10 flex items-center justify-center rounded-xl 
            bg-card border border-border/50 shadow-sm
            hover:shadow-md hover:scale-105 active:scale-95 
            transition-all duration-300 ease-out
            group"
          aria-label="帮助"
        >
          <HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>

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
