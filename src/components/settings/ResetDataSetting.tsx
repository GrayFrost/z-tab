import { useState } from 'react'
import { RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingCard } from './SettingCard'
import { db } from '@/lib/db'
import { useTheme } from '@/hooks/useTheme'

interface ResetDataSettingProps {
  onResetComplete?: () => void
}

export function ResetDataSetting({ onResetComplete }: ResetDataSettingProps) {
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

      // 3. 通知父组件重置完成
      onResetComplete?.()

      // 4. 等待动画完成后再刷新页面（动画时长约 300ms）
      setTimeout(() => {
        window.location.reload()
      }, 350)
    } catch (error) {
      console.error('Reset failed:', error)
      setIsResetting(false)
    }
  }

  // 暴露重置确认状态的方法
  const resetConfirmState = () => setShowConfirm(false)

  return (
    <SettingCard
      icon={<RotateCcw className="w-4 h-4 text-destructive" />}
      iconBgClass="bg-destructive/10"
      title="重置页面"
      description="恢复到初始状态，包括预设网站和日间主题。此操作不可撤销。"
    >
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
        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={resetConfirmState}>
          取消
        </Button>
      )}
    </SettingCard>
  )
}

