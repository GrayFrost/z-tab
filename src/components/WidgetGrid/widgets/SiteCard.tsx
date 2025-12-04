import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import type { SiteItem } from '../types'
import { getNextFaviconUrl } from '../utils/favicon'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

interface SiteCardProps {
  site: SiteItem
  onDelete?: () => void
}

export function SiteCard({ site, onDelete }: SiteCardProps) {
  const [currentFavicon, setCurrentFavicon] = useState(site.favicon)
  const [showFallback, setShowFallback] = useState(false)
  const isDragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY }
    isDragging.current = false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = Math.abs(e.clientX - startPos.current.x)
    const dy = Math.abs(e.clientY - startPos.current.y)
    // 移动超过 5px 认为是拖拽
    if (dx > 5 || dy > 5) {
      isDragging.current = true
    }
  }

  const handleClick = () => {
    // 拖拽后不跳转
    if (isDragging.current) {
      isDragging.current = false
      return
    }
    window.open(site.url, '_blank')
  }

  const handleImageError = () => {
    const nextUrl = getNextFaviconUrl(site.url, currentFavicon)
    if (nextUrl) {
      setCurrentFavicon(nextUrl)
    } else {
      setShowFallback(true)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          className="relative h-full rounded-2xl bg-card border border-border flex items-center justify-center cursor-move hover:shadow-lg hover:scale-105 transition-all overflow-visible select-none"
          title={site.title}
        >
          {showFallback ? (
            <span className="text-2xl font-semibold text-muted-foreground">
              {site.title.charAt(0).toUpperCase()}
            </span>
          ) : (
            <img
              src={currentFavicon}
              alt={site.title}
              className="w-10 h-10 object-contain pointer-events-none"
              onError={handleImageError}
            />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          删除
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
