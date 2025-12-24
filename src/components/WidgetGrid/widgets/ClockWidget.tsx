import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIconStyle } from '@/contexts/IconStyleContext'

interface ClockWidgetProps {
  widgetId: string
  onDelete?: () => void
  preview?: boolean // 预览模式，不显示删除按钮
}

// 7段数码管数字组件 - 保持尺寸一致且小巧
function SevenSegmentDigit({ digit, color, inactiveColor }: { digit: number, color: string, inactiveColor: string }) {
  const segments = {
    0: [true, true, true, true, true, true, false],
    1: [false, true, true, false, false, false, false],
    2: [true, true, false, true, true, false, true],
    3: [true, true, true, true, false, false, true],
    4: [false, true, true, false, false, true, true],
    5: [true, false, true, true, false, true, true],
    6: [true, false, true, true, true, true, true],
    7: [true, true, true, false, false, false, false],
    8: [true, true, true, true, true, true, true],
    9: [true, true, true, true, false, true, true],
  }[digit] || [false, false, false, false, false, false, false]

  const segmentClasses = "absolute rounded-full transition-all duration-300"
  
  return (
    <div className="relative w-5 h-8 mx-0.5">
      {/* a: top */}
      <div className={cn(segmentClasses, "top-0 left-0.5 right-0.5 h-0.5", segments[0] ? color : inactiveColor)} />
      {/* b: top-right */}
      <div className={cn(segmentClasses, "top-0.5 right-0 bottom-[52%] w-0.5", segments[1] ? color : inactiveColor)} />
      {/* c: bottom-right */}
      <div className={cn(segmentClasses, "top-[52%] right-0 bottom-0.5 w-0.5", segments[2] ? color : inactiveColor)} />
      {/* d: bottom */}
      <div className={cn(segmentClasses, "bottom-0 left-0.5 right-0.5 h-0.5", segments[3] ? color : inactiveColor)} />
      {/* e: bottom-left */}
      <div className={cn(segmentClasses, "top-[52%] left-0 bottom-0.5 w-0.5", segments[4] ? color : inactiveColor)} />
      {/* f: top-left */}
      <div className={cn(segmentClasses, "top-0.5 left-0 bottom-[52%] w-0.5", segments[5] ? color : inactiveColor)} />
      {/* g: middle */}
      <div className={cn(segmentClasses, "top-[48%] left-0.5 right-0.5 h-0.5", segments[6] ? color : inactiveColor)} />
    </div>
  )
}

export function ClockWidget({ onDelete, preview = false }: ClockWidgetProps) {
  const { iconStyle } = useIconStyle()
  const isColorful = iconStyle === 'colorful'
  const [time, setTime] = useState(new Date())
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = () => setShowMenu(false)
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

  const handleContextMenu = (e: React.MouseEvent) => {
    if (preview) { e.preventDefault(); return }
    e.preventDefault()
    e.stopPropagation()
    setShowMenu((prev) => !prev)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onDelete?.()
  }

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = time.getHours()
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  const activeColor = isColorful 
    ? "bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]" 
    : "bg-primary"
  const inactiveColor = isColorful 
    ? "bg-green-900/10" 
    : "bg-muted-foreground/5"

  return (
    <div
      onContextMenu={handleContextMenu}
      className={cn(
        "relative h-full w-full rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden",
        isColorful
          ? "bg-slate-950 border border-primary/20"
          : "bg-card border border-border/50"
      )}
    >
      {!preview && showMenu && (
        <button
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-1 left-1 z-10 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* 液晶显示区域容器 */}
      <div className={cn(
        "flex items-center gap-0.5 px-2 py-1.5 rounded-lg",
        isColorful ? "bg-black/20" : "bg-transparent"
      )}>
        {/* Hours */}
        <div className="flex">
          <SevenSegmentDigit digit={Math.floor(hours / 10)} color={activeColor} inactiveColor={inactiveColor} />
          <SevenSegmentDigit digit={hours % 10} color={activeColor} inactiveColor={inactiveColor} />
        </div>

        {/* Colon */}
        <div className="flex flex-col gap-1.5 mx-0.5">
          <div className={cn("w-0.5 h-0.5 rounded-full animate-pulse", activeColor)} />
          <div className={cn("w-0.5 h-0.5 rounded-full animate-pulse", activeColor)} />
        </div>

        {/* Minutes */}
        <div className="flex">
          <SevenSegmentDigit digit={Math.floor(minutes / 10)} color={activeColor} inactiveColor={inactiveColor} />
          <SevenSegmentDigit digit={minutes % 10} color={activeColor} inactiveColor={inactiveColor} />
        </div>

        {/* Colon */}
        <div className="flex flex-col gap-1.5 mx-0.5">
          <div className={cn("w-0.5 h-0.5 rounded-full animate-pulse", activeColor)} />
          <div className={cn("w-0.5 h-0.5 rounded-full animate-pulse", activeColor)} />
        </div>

        {/* Seconds - 现在尺寸与时分一致 */}
        <div className="flex">
          <SevenSegmentDigit digit={Math.floor(seconds / 10)} color={isColorful ? "bg-orange-400 shadow-[0_0_5px_rgba(251,146,60,0.8)]" : activeColor} inactiveColor={inactiveColor} />
          <SevenSegmentDigit digit={seconds % 10} color={isColorful ? "bg-orange-400 shadow-[0_0_5px_rgba(251,146,60,0.8)]" : activeColor} inactiveColor={inactiveColor} />
        </div>
      </div>
    </div>
  )
}
