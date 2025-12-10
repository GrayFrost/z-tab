import { useState, useEffect, useRef } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClockWidgetProps {
  widgetId: string
}

export function ClockWidget({ widgetId }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date())
  const prevSecondsRef = useRef<number | null>(null)
  const prevMinutesRef = useRef<number | null>(null)
  const prevHoursRef = useRef<number | null>(null)
  const [shouldAnimateSeconds, setShouldAnimateSeconds] = useState(true)
  const [shouldAnimateMinutes, setShouldAnimateMinutes] = useState(true)
  const [shouldAnimateHours, setShouldAnimateHours] = useState(true)

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
    <div className="h-full w-full rounded-2xl bg-card border border-border/50 p-2 flex items-stretch gap-2 shadow-sm hover:shadow-md hover:border-border transition-all duration-300">
      {/* 左侧：小时显示 */}
      <div className="flex-1 relative rounded-lg overflow-hidden bg-muted/30" style={{ minHeight: 0 }}>
        {/* 进度条背景（从底部向上填充） */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-primary/20",
            shouldAnimateHours ? "transition-all duration-1000 ease-linear" : "transition-none"
          )}
          style={{ 
            height: `${hoursProgress}%`,
            transition: shouldAnimateHours ? 'height 1s linear' : 'none'
          }}
        />
        {/* 小时数字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-foreground tabular-nums z-10 leading-none">
            {hours.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* 右侧：分钟显示 */}
      <div className="flex-1 relative rounded-lg overflow-hidden bg-muted/30" style={{ minHeight: 0 }}>
        {/* 进度条背景（从底部向上填充，表示分钟进度） */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-primary/20",
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
            "absolute bottom-0 left-0 right-0 bg-primary/40",
            shouldAnimateSeconds ? "transition-all duration-1000 ease-linear" : "transition-none"
          )}
          style={{ 
            height: `${secondsProgress}%`,
            transition: shouldAnimateSeconds ? 'height 1s linear' : 'none'
          }}
        />
        {/* 分钟数字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-foreground tabular-nums z-10 leading-none">
            {minutes.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  )
}

