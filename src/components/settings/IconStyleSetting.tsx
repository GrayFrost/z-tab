import { Palette, Minus } from 'lucide-react'
import { SettingCard } from './SettingCard'
import { useIconStyle, IconStyle } from '@/contexts/IconStyleContext'

export function IconStyleSetting() {
  const { iconStyle, setIconStyle } = useIconStyle()

  const options: { value: IconStyle; label: string; description: string }[] = [
    { value: 'minimal', label: '简约', description: '线条风格图标' },
    { value: 'colorful', label: '绚丽', description: '彩色填充图标' },
  ]

  return (
    <SettingCard
      icon={
        iconStyle === 'colorful' ? (
          <Palette className="w-4 h-4 text-primary" />
        ) : (
          <Minus className="w-4 h-4 text-primary" />
        )
      }
      title="图标风格"
      description="选择网站图标的显示风格"
    >
      <div className="mt-4 flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setIconStyle(option.value)}
            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
              iconStyle === option.value
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-border/80 hover:bg-muted/50'
            }`}
          >
            <div className="text-sm font-medium">{option.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
          </button>
        ))}
      </div>
    </SettingCard>
  )
}

