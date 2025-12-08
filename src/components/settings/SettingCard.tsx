import { ReactNode } from 'react'

interface SettingCardProps {
  icon: ReactNode
  iconBgClass?: string
  title: string
  description: string
  action?: ReactNode
  children?: ReactNode
}

export function SettingCard({
  icon,
  iconBgClass = 'bg-primary/10',
  title,
  description,
  action,
  children,
}: SettingCardProps) {
  return (
    <div className="p-4 rounded-lg border border-border bg-background/50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${iconBgClass}`}>{icon}</div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

