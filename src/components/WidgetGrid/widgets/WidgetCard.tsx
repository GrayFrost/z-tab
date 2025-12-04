import type { WidgetItem } from '../types'

interface WidgetCardProps {
  widget: WidgetItem
}

export function WidgetCard({ widget }: WidgetCardProps) {
  const sizeLabel = widget.size.replace('x', '×')
  const Icon = widget.icon

  return (
    <div className="h-full rounded-2xl bg-card border border-border p-4 flex flex-col cursor-move">
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
  )
}

