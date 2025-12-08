import { Eye, EyeOff } from 'lucide-react'
import { SettingCard } from './SettingCard'
import { Switch } from './Switch'
import { db } from '@/lib/db'

interface AutoHideButtonsSettingProps {
  value: boolean
  onChange: (value: boolean) => void
}

export function AutoHideButtonsSetting({ value, onChange }: AutoHideButtonsSettingProps) {
  const handleChange = (newValue: boolean) => {
    onChange(newValue)
    db.settings.set('auto-hide-buttons', newValue)
  }

  return (
    <SettingCard
      icon={
        value ? (
          <EyeOff className="w-4 h-4 text-primary" />
        ) : (
          <Eye className="w-4 h-4 text-primary" />
        )
      }
      title="自动隐藏按钮"
      description="开启后，右侧按钮将在鼠标悬浮时才显示"
      action={<Switch checked={value} onChange={handleChange} />}
    />
  )
}

