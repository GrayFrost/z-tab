import { useState } from 'react'
import { Settings } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AutoHideButtonsSetting, ResetDataSetting } from '@/components/settings'

interface SettingsDrawerProps {
  autoHideButtons: boolean
  onAutoHideButtonsChange: (value: boolean) => void
}

export function SettingsDrawer({ autoHideButtons, onAutoHideButtonsChange }: SettingsDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="h-10 w-10 flex items-center justify-center rounded-xl 
            bg-card border border-border/50 shadow-sm
            hover:shadow-md hover:scale-105 active:scale-95 
            transition-all duration-300 ease-out
            group"
          aria-label="设置"
        >
          <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:rotate-180 transition-all duration-500 ease-in-out" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            设置
          </SheetTitle>
          <SheetDescription>管理你的 Z-Tab 新标签页</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* 显示设置 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">显示设置</h3>
            <AutoHideButtonsSetting value={autoHideButtons} onChange={onAutoHideButtonsChange} />
          </div>

          {/* 数据管理 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">数据管理</h3>
            <ResetDataSetting onResetComplete={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
