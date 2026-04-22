import { useState, useEffect } from 'react'
import type { MouseEvent } from 'react'
import { X, Calendar, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIconStyle } from '@/contexts/IconStyleContext'
import { Lunar } from 'lunar-javascript'

interface DateWidgetProps {
  widgetId: string
  onDelete?: () => void
  preview?: boolean
}

export function DateWidget({ onDelete, preview = false }: DateWidgetProps) {
  const { iconStyle } = useIconStyle()
  const isColorful = iconStyle === 'colorful'
  const [date, setDate] = useState(new Date())
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = () => {
      setShowMenu(false)
    }

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

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()

    if (preview) {
      return
    }

    e.stopPropagation()
    setShowMenu((prev) => !prev)
  }

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onDelete?.()
  }

  useEffect(() => {
    const updateDate = () => {
      setDate(new Date())
    }

    updateDate()
    const timer = setInterval(updateDate, 60000)

    return () => clearInterval(timer)
  }, [])

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDay = date.getDay()
  const weekNames = ['日', '一', '二', '三', '四', '五', '六']
  const weekDayName = `星期${weekNames[weekDay]}`

  const lunar = Lunar.fromDate(date)
  const lunarMonth = lunar.getMonthInChinese()
  const lunarDay = lunar.getDayInChinese()
  const ganZhi = lunar.getYearInGanZhi()
  const zodiac = lunar.getYearShengXiao()
  const festival = lunar.getFestivals().join(' ') || lunar.getOtherFestivals().join(' ')
  const jieQi = lunar.getJieQi()
  const yi = lunar.getDayYi() || []
  const ji = lunar.getDayJi() || []

  const lunarDateLabel = `${lunarMonth}${lunarDay}`
  const holidayLabel = festival || jieQi
  const yiText = yi.slice(0, 4).join(' / ')
  const jiText = ji.slice(0, 4).join(' / ')

  return (
    <div
      onContextMenu={handleContextMenu}
      className={cn(
        'relative h-full w-full select-none overflow-visible rounded-xl p-4 transition-all duration-300',
        isColorful
          ? 'border border-amber-400/30 bg-[linear-gradient(135deg,hsl(var(--card))_0%,rgba(251,191,36,0.12)_48%,rgba(14,165,233,0.10)_100%)] shadow-sm hover:border-amber-400/50 hover:shadow-md'
          : 'border border-border/60 bg-card shadow-sm hover:border-border hover:shadow-md'
      )}
    >
      {!preview && showMenu && (
        <button
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -left-2 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition-colors hover:bg-destructive/90"
          title="删除"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="flex h-full gap-4">
        <div className="flex w-[138px] shrink-0 flex-col justify-between">
          <div>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium',
                isColorful
                  ? 'bg-amber-400/15 text-amber-700 dark:text-amber-300'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              {weekDayName}
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-[64px] font-semibold leading-[0.86] tracking-normal text-foreground">
                {day}
              </span>
              <div className="pb-1.5 text-sm font-medium leading-tight text-muted-foreground">
                <div>{year}</div>
                <div>{month.toString().padStart(2, '0')}月</div>
              </div>
            </div>
          </div>

        </div>

        <div className="min-w-0 flex-1 border-l border-border/70 pl-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-normal text-muted-foreground">
                农历
              </div>
              <div className="mt-1 truncate text-xl font-semibold leading-none text-foreground">
                {lunarDateLabel}
              </div>
            </div>
            {holidayLabel && (
              <div
                className={cn(
                  'max-w-[104px] truncate rounded-md px-2 py-1 text-[11px] font-medium',
                  isColorful
                    ? 'bg-rose-400/15 text-rose-700 dark:text-rose-300'
                    : 'bg-muted text-foreground/75'
                )}
                title={holidayLabel}
              >
                {holidayLabel}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles
              className={cn(
                'h-3.5 w-3.5',
                isColorful ? 'text-sky-600 dark:text-sky-300' : 'text-foreground/45'
              )}
            />
            <span className="truncate">
              {ganZhi}年 · {zodiac}
            </span>
          </div>

          {(yi.length > 0 || ji.length > 0) && (
            <div className="mt-4 grid gap-2">
              {yi.length > 0 && (
                <div className="grid grid-cols-[22px_minmax(0,1fr)] items-start gap-2">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none',
                      isColorful
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    )}
                  >
                    宜
                  </span>
                  <span
                    className="truncate text-xs leading-5 text-foreground/80"
                    title={yi.join(' ')}
                  >
                    {yiText}
                  </span>
                </div>
              )}

              {ji.length > 0 && (
                <div className="grid grid-cols-[22px_minmax(0,1fr)] items-start gap-2">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none',
                      isColorful
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    )}
                  >
                    忌
                  </span>
                  <span
                    className="truncate text-xs leading-5 text-foreground/80"
                    title={ji.join(' ')}
                  >
                    {jiText}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
