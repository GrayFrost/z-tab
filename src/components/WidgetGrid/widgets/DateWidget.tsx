import { useState, useEffect } from 'react'
import { X, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIconStyle } from '@/contexts/IconStyleContext'
import { Lunar } from 'lunar-javascript'

interface DateWidgetProps {
  widgetId: string
  onDelete?: () => void
  preview?: boolean // 预览模式，不显示删除按钮
}

export function DateWidget({ onDelete, preview = false }: DateWidgetProps) {
  const { iconStyle } = useIconStyle()
  const isColorful = iconStyle === 'colorful'
  const [date, setDate] = useState(new Date())
  const [showMenu, setShowMenu] = useState(false)

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

  // 更新日期（每分钟更新一次）
  useEffect(() => {
    const updateDate = () => {
      setDate(new Date())
    }

    // 立即更新一次
    updateDate()

    // 每分钟更新一次
    const timer = setInterval(updateDate, 60000)

    return () => clearInterval(timer)
  }, [])

  // 格式化公历日期
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDay = date.getDay()
  const weekNames = ['日', '一', '二', '三', '四', '五', '六']
  const weekDayName = `星期${weekNames[weekDay]}`

  // 获取农历信息
  const lunar = Lunar.fromDate(date)
  const lunarYear = lunar.getYearInChinese()
  const lunarMonth = lunar.getMonthInChinese()
  const lunarDay = lunar.getDayInChinese()
  const ganZhi = lunar.getYearInGanZhi()
  const zodiac = lunar.getYearShengXiao()
  const festival = lunar.getFestivals().join(' ') || lunar.getOtherFestivals().join(' ')
  const jieQi = lunar.getJieQi()

  return (
    <div
      onContextMenu={handleContextMenu}
      className={cn(
        'relative h-full w-full rounded-2xl p-4 flex flex-col transition-all duration-300 overflow-hidden',
        isColorful
          ? 'bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/30 shadow-lg hover:shadow-xl hover:border-primary/50'
          : 'bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-border'
      )}
    >
      {/* 删除按钮（预览模式下不显示） */}
      {!preview && showMenu && (
        <button
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors"
          title="删除"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 顶部：公历日期 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar
            className={cn(
              'w-5 h-5',
              isColorful ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/60'
            )}
          />
          <span
            className={cn(
              'text-sm font-medium',
              isColorful ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/80'
            )}
          >
            公历
          </span>
        </div>
        <span
          className={cn(
            'text-xs',
            isColorful ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'
          )}
        >
          {weekDayName}
        </span>
      </div>

      {/* 公历日期显示 */}
      <div className="mb-4">
        <div
          className={cn(
            'text-4xl font-bold mb-1',
            isColorful ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'
          )}
        >
          {year}年{month}月{day}日
        </div>
        <div
          className={cn(
            'text-2xl font-semibold',
            isColorful ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/90'
          )}
        >
          {month.toString().padStart(2, '0')}-{day.toString().padStart(2, '0')}
        </div>
      </div>

      {/* 分隔线 */}
      <div
        className={cn(
          'h-px mb-4',
          isColorful ? 'bg-gradient-to-r from-transparent via-primary/30 to-transparent' : 'bg-border'
        )}
      />

      {/* 底部：农历信息 */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div
            className={cn(
              'text-xs mb-2',
              isColorful ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'
            )}
          >
            农历
          </div>
          <div
            className={cn(
              'text-2xl font-bold mb-1',
              isColorful ? 'text-purple-700 dark:text-purple-300' : 'text-foreground'
            )}
          >
            {lunarMonth}
            {lunarDay}
          </div>
        </div>

        <div className="space-y-1">
          {/* 天干地支和生肖 */}
          <div
            className={cn(
              'text-sm font-medium',
              isColorful ? 'text-purple-600 dark:text-purple-400' : 'text-foreground/80'
            )}
          >
            {ganZhi}年 · {zodiac}
          </div>

          {/* 节日或节气 */}
          {(festival || jieQi) && (
            <div
              className={cn(
                'text-xs truncate',
                isColorful ? 'text-pink-600 dark:text-pink-400' : 'text-muted-foreground'
              )}
              title={festival || jieQi}
            >
              {festival || jieQi}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

