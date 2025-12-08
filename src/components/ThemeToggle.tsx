import { useTheme } from '@/hooks/useTheme'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="h-10 w-10 flex items-center justify-center rounded-xl 
        bg-card border border-border/50 shadow-sm
        hover:shadow-md hover:scale-105 active:scale-95 
        transition-all duration-300 ease-out
        group"
      aria-label={theme === 'light' ? '切换到夜间模式' : '切换到日间模式'}
    >
      <div className="relative w-5 h-5">
        {/* 太阳图标 */}
        <Sun
          className={`w-5 h-5 text-amber-500 absolute inset-0 transition-all duration-300 ease-out
            ${
              theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
            }`}
        />
        {/* 月亮图标 */}
        <Moon
          className={`w-5 h-5 text-indigo-400 absolute inset-0 transition-all duration-300 ease-out
            ${
              theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
            }`}
        />
      </div>
    </button>
  )
}
