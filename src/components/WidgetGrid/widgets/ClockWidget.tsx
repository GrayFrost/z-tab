import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface ClockWidgetProps {
  widgetId: string
}

export function ClockWidget({ widgetId }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return { hours, minutes, seconds }
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekday = weekdays[date.getDay()]
    return { year, month, day, weekday }
  }

  const { hours, minutes, seconds } = formatTime(time)
  const { year, month, day, weekday } = formatDate(time)

  return (
    <div className="h-full rounded-2xl bg-card border border-border/50 p-4 flex flex-col shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">时钟</span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        {/* 时间显示 */}
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground tabular-nums">{hours}</span>
          <span className="text-2xl text-muted-foreground">:</span>
          <span className="text-4xl font-bold text-foreground tabular-nums">{minutes}</span>
          <span className="text-2xl text-muted-foreground">:</span>
          <span className="text-3xl font-semibold text-muted-foreground tabular-nums">{seconds}</span>
        </div>
        
        {/* 日期显示 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{year}-{month}-{day}</span>
          <span className="text-xs">•</span>
          <span>{weekday}</span>
        </div>
      </div>
    </div>
  )
}

