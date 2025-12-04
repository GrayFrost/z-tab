import { Plus } from 'lucide-react'

interface AddSiteCardProps {
  onClick: () => void
}

export function AddSiteCard({ onClick }: AddSiteCardProps) {
  return (
    <div
      onClick={onClick}
      className="h-full rounded-2xl border-2 border-dashed border-border p-3 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors group"
    >
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-1.5 group-hover:bg-primary/10 transition-colors">
        <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
        添加网站
      </span>
    </div>
  )
}

