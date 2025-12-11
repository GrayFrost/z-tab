import { useState } from 'react'
import { Layout, CheckCircle2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { availableWidgets } from './data'
import { ClockWidget } from './widgets/ClockWidget'
import { DateWidget } from './widgets/DateWidget'
import { WidgetCard } from './widgets/WidgetCard'
import { CELL_SIZE, GRID_MARGIN } from './constants'
import type { WidgetItem, GridItem } from './types'

interface WidgetDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWidget: (widget: WidgetItem) => void
  existingItems?: GridItem[]
}

export function WidgetDrawer({ open, onOpenChange, onAddWidget, existingItems = [] }: WidgetDrawerProps) {
  const [hoveredWidgetId, setHoveredWidgetId] = useState<string | null>(null)

  // 检查组件是否已存在（通过基础 id 判断，如 'clock'）
  const isWidgetExists = (widgetId: string) => {
    return existingItems.some((item) => {
      if (item.type === 'widget') {
        // 提取基础 id（去掉时间戳部分）
        const baseId = widgetId.split('-')[0]
        const existingBaseId = item.id.split('-')[0]
        return baseId === existingBaseId
      }
      return false
    })
  }

  // 渲染组件预览
  const renderWidgetPreview = (widget: WidgetItem) => {
    // 根据 widget id 渲染不同的预览组件
    if (widget.id.startsWith('clock')) {
      // 计算预览尺寸（根据 widget size）
      const [w, h] = widget.size.split('x').map(Number)
      const previewWidth = w * CELL_SIZE + (w - 1) * GRID_MARGIN
      const previewHeight = h * CELL_SIZE + (h - 1) * GRID_MARGIN

      return (
        <div
          style={{
            width: previewWidth,
            height: previewHeight,
            pointerEvents: 'none',
          }}
          className="flex-shrink-0 scale-90"
        >
          <ClockWidget widgetId={widget.id} preview={true} />
        </div>
      )
    }

    if (widget.id.startsWith('date')) {
      // 计算预览尺寸（根据 widget size）
      const [w, h] = widget.size.split('x').map(Number)
      const previewWidth = w * CELL_SIZE + (w - 1) * GRID_MARGIN
      const previewHeight = h * CELL_SIZE + (h - 1) * GRID_MARGIN

      return (
        <div
          style={{
            width: previewWidth,
            height: previewHeight,
            pointerEvents: 'none',
          }}
          className="flex-shrink-0 scale-90"
        >
          <DateWidget widgetId={widget.id} preview={true} />
        </div>
      )
    }

    // 默认渲染 WidgetCard
    const [w, h] = widget.size.split('x').map(Number)
    const previewWidth = w * CELL_SIZE + (w - 1) * GRID_MARGIN
    const previewHeight = h * CELL_SIZE + (h - 1) * GRID_MARGIN

    return (
      <div
        style={{
          width: previewWidth,
          height: previewHeight,
          pointerEvents: 'none',
        }}
        className="flex-shrink-0 scale-90"
      >
        <WidgetCard widget={widget} />
      </div>
    )
  }

  const handleWidgetClick = (widget: WidgetItem) => {
    // 检查是否已存在
    if (isWidgetExists(widget.id)) {
      return
    }
    onAddWidget(widget)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            添加组件
          </SheetTitle>
          <SheetDescription>选择要添加到桌面的功能组件</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-4">
          {availableWidgets.map((widget) => {
            const exists = isWidgetExists(widget.id)
            const isHovered = hoveredWidgetId === widget.id

            return (
              <div
                key={widget.id}
                className="relative rounded-xl border border-border/50 bg-card overflow-hidden"
                onMouseEnter={() => setHoveredWidgetId(widget.id)}
                onMouseLeave={() => setHoveredWidgetId(null)}
              >
                {/* 组件预览 */}
                <div className="p-4 flex items-center justify-center bg-muted/20">
                  {renderWidgetPreview(widget)}
                </div>

                {/* 蒙版层 - 鼠标悬停时显示 */}
                {isHovered && !exists && (
                  <div
                    onClick={() => handleWidgetClick(widget)}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center cursor-pointer z-10 transition-opacity"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Layout className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">点击添加</span>
                    </div>
                  </div>
                )}

                {/* 已存在提示 */}
                {exists && (
                  <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border/30">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">已添加</span>
                    </div>
                  </div>
                )}

                {/* 组件信息 */}
                <div className="p-3 border-t border-border/50 bg-card">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">{widget.title}</h3>
                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {widget.size.replace('x', '×')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}

