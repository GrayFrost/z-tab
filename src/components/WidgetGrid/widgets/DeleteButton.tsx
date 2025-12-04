import { X } from 'lucide-react'

interface DeleteButtonProps {
  onDelete: () => void
}

export function DeleteButton({ onDelete }: DeleteButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发卡片的点击事件
    onDelete()
  }

  return (
    <button
      onClick={handleClick}
      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-md z-10"
      title="删除"
    >
      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
    </button>
  )
}

