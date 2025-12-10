import { LayoutGrid } from 'lucide-react'

interface AddWidgetButtonProps {
  onClick: () => void
}

export function AddWidgetButton({ onClick }: AddWidgetButtonProps) {
  return (
    <button
      onClick={onClick}
      className="h-10 w-10 flex items-center justify-center rounded-xl 
        bg-card border border-border/50 shadow-sm
        hover:shadow-md hover:scale-105 active:scale-95 
        transition-all duration-300 ease-out
        group"
      aria-label="添加组件"
    >
      <LayoutGrid className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
    </button>
  )
}

