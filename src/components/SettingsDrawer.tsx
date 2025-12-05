import { useState } from 'react'
import { Settings, RotateCcw, AlertTriangle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { useTheme } from '@/hooks/useTheme'

export function SettingsDrawer() {
  const [open, setOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { setTheme } = useTheme()

  const handleReset = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsResetting(true)
    try {
      // 1. 清空 IndexedDB 所有数据
      await db.resetAll()

      // 2. 重置主题为 light
      setTheme('light')

      // 3. 关闭抽屉并刷新页面以重新加载预设数据
      setOpen(false)
      window.location.reload()
    } catch (error) {
      console.error('Reset failed:', error)
      setIsResetting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // 关闭时重置确认状态
      setShowConfirm(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          className="fixed top-[72px] right-6 z-50 h-10 w-10 flex items-center justify-center rounded-xl 
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
          {/* 重置区域 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">数据管理</h3>
            <div className="p-4 rounded-lg border border-border bg-background/50">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <RotateCcw className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">重置页面</p>
                  <p className="text-xs text-muted-foreground">
                    恢复到初始状态，包括预设网站和日间主题。此操作不可撤销。
                  </p>
                </div>
              </div>

              {showConfirm && (
                <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">确认重置？</span>
                  </div>
                  <p className="mt-1 text-xs text-destructive/80">
                    所有自定义网站和布局将被删除，主题将恢复为日间模式。
                  </p>
                </div>
              )}

              <Button
                variant={showConfirm ? 'destructive' : 'outline'}
                size="sm"
                className="mt-4 w-full"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    重置中...
                  </>
                ) : showConfirm ? (
                  '确认重置'
                ) : (
                  '重置页面'
                )}
              </Button>

              {showConfirm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setShowConfirm(false)}
                >
                  取消
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

