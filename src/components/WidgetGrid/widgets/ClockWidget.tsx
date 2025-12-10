import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIconStyle } from '@/contexts/IconStyleContext'

interface ClockWidgetProps {
  widgetId: string
  onDelete?: () => void
  preview?: boolean // 预览模式，不显示删除按钮
}

export function ClockWidget({ onDelete, preview = false }: ClockWidgetProps) {
  const { iconStyle } = useIconStyle()
  const isColorful = iconStyle === 'colorful'
  const [time, setTime] = useState(new Date())
  const [showMenu, setShowMenu] = useState(false)
  const prevSecondsRef = useRef<number | null>(null)
  const prevMinutesRef = useRef<number | null>(null)
  const prevHoursRef = useRef<number | null>(null)
  const [shouldAnimateSeconds, setShouldAnimateSeconds] = useState(true)
  const [shouldAnimateMinutes, setShouldAnimateMinutes] = useState(true)
  const [shouldAnimateHours, setShouldAnimateHours] = useState(true)

  // 点击其他地方时隐藏菜单
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = () => {
      setShowMenu(false)
    }

    // 延迟添加监听，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('contextmenu', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('contextmenu', handleClickOutside)
    }
  }, [showMenu])

  // 右键显示/隐藏菜单（预览模式下禁用）
  const handleContextMenu = (e: React.MouseEvent) => {
    if (preview) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    e.stopPropagation()
    setShowMenu((prev) => !prev)
  }

  // 点击删除按钮
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onDelete?.()
  }

  useEffect(() => {
    // 立即设置一次时间
    const now = new Date()
    setTime(now)
    const initialSeconds = now.getSeconds()
    const initialMinutes = now.getMinutes()
    const initialHours = now.getHours()
    prevSecondsRef.current = initialSeconds
    prevMinutesRef.current = initialMinutes
    prevHoursRef.current = initialHours
    
    // 每秒更新一次时间（24小时制）
    const timer = setInterval(() => {
      const newTime = new Date()
      const newSeconds = newTime.getSeconds()
      const newMinutes = newTime.getMinutes()
      const newHours = newTime.getHours()
      
      // 判断是否需要动画（在更新前判断）
      const animateSeconds = prevSecondsRef.current === null || newSeconds >= prevSecondsRef.current
      const animateMinutes = prevMinutesRef.current === null || newMinutes >= prevMinutesRef.current
      const animateHours = prevHoursRef.current === null || newHours >= prevHoursRef.current
      
      // 更新动画状态
      setShouldAnimateSeconds(animateSeconds)
      setShouldAnimateMinutes(animateMinutes)
      setShouldAnimateHours(animateHours)
      
      // 更新前一个值
      prevSecondsRef.current = newSeconds
      prevMinutesRef.current = newMinutes
      prevHoursRef.current = newHours
      
      // 更新当前时间
      setTime(newTime)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 使用24小时制格式化时间
  const formatTime = (date: Date) => {
    // getHours() 返回 0-23，已经是24小时制
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()
    return { hours, minutes, seconds }
  }

  const { hours, minutes, seconds } = formatTime(time)
  
  // 计算进度百分比（0-100%）
  // 秒数进度：当前秒数 / 60
  const secondsProgress = (seconds / 60) * 100
  
  // 小时进度：当前小时 / 24
  const hoursProgress = (hours / 24) * 100
  
  // 分钟进度：当前分钟 / 60
  const minutesProgress = (minutes / 60) * 100
  

  return (
    <div
      onContextMenu={handleContextMenu}
      className={cn(
        "relative h-full w-full rounded-2xl p-2 flex items-stretch gap-2 transition-all duration-300 overflow-visible",
        isColorful
          ? "bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/30 shadow-lg hover:shadow-xl hover:border-primary/50"
          : "bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-border"
      )}
    >
      {/* 删除按钮（预览模式下不显示） */}
      {!preview && showMenu && (
        <button
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors"
          title="删除"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 左侧：小时显示 */}
      <div
        className={cn(
          "flex-1 relative rounded-lg overflow-hidden",
          isColorful ? "bg-gradient-to-b from-blue-500/20 to-purple-500/20" : "bg-muted/30"
        )}
        style={{ minHeight: 0 }}
      >
        {/* 进度条背景（从底部向上填充） */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0",
            isColorful
              ? "bg-gradient-to-t from-blue-500/60 via-blue-400/50 to-blue-300/40"
              : "bg-primary/20",
            shouldAnimateHours ? "transition-all duration-1000 ease-linear" : "transition-none"
          )}
          style={{ 
            height: `${hoursProgress}%`,
            transition: shouldAnimateHours ? 'height 1s linear' : 'none'
          }}
        />
        {/* 小时数字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "text-3xl font-bold tabular-nums z-10 leading-none",
              isColorful ? "text-blue-600 dark:text-blue-400 drop-shadow-sm" : "text-foreground"
            )}
          >
            {hours.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* 右侧：分钟显示 */}
      <div
        className={cn(
          "flex-1 relative rounded-lg overflow-hidden",
          isColorful ? "bg-gradient-to-b from-purple-500/20 to-pink-500/20" : "bg-muted/30"
        )}
        style={{ minHeight: 0 }}
      >
        {/* 进度条背景（从底部向上填充，表示分钟进度） */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0",
            isColorful
              ? "bg-gradient-to-t from-purple-500/60 via-purple-400/50 to-purple-300/40"
              : "bg-primary/20",
            shouldAnimateMinutes ? "transition-all duration-1000 ease-linear" : "transition-none"
          )}
          style={{ 
            height: `${minutesProgress}%`,
            transition: shouldAnimateMinutes ? 'height 1s linear' : 'none'
          }}
        />
        {/* 秒数进度条叠加（更明显的颜色） */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0",
            isColorful
              ? "bg-gradient-to-t from-pink-500/70 via-pink-400/60 to-pink-300/50"
              : "bg-primary/40",
            shouldAnimateSeconds ? "transition-all duration-1000 ease-linear" : "transition-none"
          )}
          style={{ 
            height: `${secondsProgress}%`,
            transition: shouldAnimateSeconds ? 'height 1s linear' : 'none'
          }}
        />
        {/* 分钟数字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "text-3xl font-bold tabular-nums z-10 leading-none",
              isColorful ? "text-purple-600 dark:text-purple-400 drop-shadow-sm" : "text-foreground"
            )}
          >
            {minutes.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  )
}

