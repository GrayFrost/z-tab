import { Trash2 } from 'lucide-react'
import type { WidgetItem } from '../types'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { ClockWidget } from './ClockWidget'

interface WidgetCardProps {
  widget: WidgetItem
  onDelete?: () => void
}

export function WidgetCard({ widget, onDelete }: WidgetCardProps) {
  // 根据widget id渲染不同的功能组件
  // widget.id 可能是 'clock' 或 'clock-${timestamp}'，所以使用 startsWith 判断
  if (widget.id.startsWith('clock')) {
    return (
      <div className="h-full w-full cursor-grab">
        <ClockWidget widgetId={widget.id} onDelete={onDelete} />
      </div>
    )
  }

  // 默认渲染（通用widget卡片）
  const sizeLabel = widget.size.replace('x', '×')
  const Icon = widget.icon

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="relative h-full rounded-2xl bg-card border border-border/50 p-4 flex flex-col cursor-grab select-none shadow-sm hover:shadow-md hover:border-border transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground/80 truncate">{widget.title}</h3>
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded shrink-0 ml-2">
              {sizeLabel}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center text-foreground/80 group">
            <Icon
              className="w-8 h-8 transition-transform duration-300 group-hover:scale-110"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          删除
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
