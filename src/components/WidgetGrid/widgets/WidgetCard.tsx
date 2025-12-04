import { Trash2 } from 'lucide-react'
import type { WidgetItem } from '../types'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

interface WidgetCardProps {
  widget: WidgetItem
  onDelete?: () => void
}

export function WidgetCard({ widget, onDelete }: WidgetCardProps) {
  const sizeLabel = widget.size.replace('x', '×')
  const Icon = widget.icon

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
          <div className="relative h-full rounded-2xl bg-card border border-border p-4 flex flex-col cursor-grab select-none">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground truncate">{widget.title}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0 ml-2">
              {sizeLabel}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <Icon className="w-8 h-8" strokeWidth={1.5} />
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          删除
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
