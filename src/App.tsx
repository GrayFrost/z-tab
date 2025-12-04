import { SearchBar } from '@/components/SearchBar'
import { WidgetGrid } from '@/components/WidgetGrid'
import { ThemeToggle } from '@/components/ThemeToggle'

function App() {
  return (
    <div className="h-screen overflow-hidden bg-neutral-50/50 dark:bg-background flex flex-col transition-colors duration-300">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500" />
      
      <ThemeToggle />
      <div className="flex flex-col items-center pt-24 px-4 relative z-10">
        <SearchBar />
        <WidgetGrid />
      </div>
    </div>
  )
}

export default App
