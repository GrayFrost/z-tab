import { useState, useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import type { SiteItem } from '../types'
import { getNextFaviconUrl } from '../utils/favicon'
import { getCachedFavicon, cacheFavicon, imageToBase64 } from '../utils/storage'
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
  // 优先使用缓存的 base64 favicon
  const cachedFavicon = getCachedFavicon(site.url)
  const [currentFavicon, setCurrentFavicon] = useState(cachedFavicon || site.favicon)
  const [showFallback, setShowFallback] = useState(false)
  const hasCached = useRef(!!cachedFavicon)

  // 后台尝试获取并缓存 favicon（不影响显示）
  useEffect(() => {
    if (hasCached.current || currentFavicon.startsWith('data:')) return
    
    // 使用隐藏的 img 尝试以 CORS 方式加载
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const base64 = imageToBase64(img)
      if (base64) {
        cacheFavicon(site.url, base64)
        hasCached.current = true
        // 可选：立即使用缓存的版本
        // setCurrentFavicon(base64)
      }
    }
    // 静默忽略错误，不影响页面显示
    img.onerror = () => {}
    img.src = currentFavicon
  }, [currentFavicon, site.url])

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
