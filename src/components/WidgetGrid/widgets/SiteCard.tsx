import { useState } from 'react'
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

  // 阻止事件冒泡，防止触发拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
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
      <ContextMenuTrigger className="h-full block">
        <div className="relative h-full rounded-2xl bg-card border border-border flex items-center justify-center cursor-grab hover:shadow-lg transition-all overflow-visible select-none">
          {/* 可点击的中心区域 */}
          <div
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            className="w-14 h-14 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform rounded-xl"
            title={`打开 ${site.title}`}
          >
            {showFallback ? (
              <span className="text-2xl font-semibold text-muted-foreground">
                {site.title.charAt(0).toUpperCase()}
              </span>
            ) : (
              <img
                src={currentFavicon}
                alt={site.title}
                className="w-10 h-10 object-contain"
                onError={handleImageError}
              />
            )}
          </div>
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
