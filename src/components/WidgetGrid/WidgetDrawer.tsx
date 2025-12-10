import { useState } from 'react'
import { Layout } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { availableWidgets } from './data'
import type { WidgetItem } from './types'

interface WidgetDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWidget: (widget: WidgetItem) => void
}

export function WidgetDrawer({ open, onOpenChange, onAddWidget }: WidgetDrawerProps) {
  const handleWidgetClick = (widget: WidgetItem) => {
    onAddWidget(widget)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            添加组件
          </SheetTitle>
          <SheetDescription>选择要添加到桌面的功能组件</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-2">
          {availableWidgets.map((widget) => {
            const Icon = widget.icon
            const sizeLabel = widget.size.replace('x', '×')

            return (
              <button
                key={widget.id}
                onClick={() => handleWidgetClick(widget)}
                className="w-full p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 hover:border-border transition-all duration-200 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{widget.title}</h3>
                      <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {sizeLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}

