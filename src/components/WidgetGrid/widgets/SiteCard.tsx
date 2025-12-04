import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { SiteItem } from '../types'
import { getNextFaviconUrl } from '../utils/favicon'
import { getCachedFavicon, cacheFavicon, imageToBase64 } from '../utils/storage'

interface SiteCardProps {
  site: SiteItem
  onDelete?: () => void
}

export function SiteCard({ site, onDelete }: SiteCardProps) {
  // 优先使用缓存的 base64 favicon
  const cachedFavicon = getCachedFavicon(site.url)
  const [currentFavicon, setCurrentFavicon] = useState(cachedFavicon || site.favicon)
  const [showFallback, setShowFallback] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const hasCached = useRef(!!cachedFavicon)

  // 后台尝试获取并缓存 favicon（不影响显示）
  useEffect(() => {
    if (hasCached.current || currentFavicon.startsWith('data:')) return
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const base64 = imageToBase64(img)
      if (base64) {
        cacheFavicon(site.url, base64)
        hasCached.current = true
      }
    }
    img.onerror = () => {}
    img.src = currentFavicon
  }, [currentFavicon, site.url])

  // 点击其他地方时隐藏删除按钮
  useEffect(() => {
    if (!showDelete) return

    const handleClickOutside = () => {
      setShowDelete(false)
    }

    // 延迟添加监听，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('contextmenu', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('contextmenu', handleClickOutside)
    }
  }, [showDelete])

  // 阻止事件冒泡，防止触发拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // 点击打开网站
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!showDelete) {
      window.open(site.url, '_blank')
    }
  }

  // 右键显示/隐藏删除按钮
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDelete(prev => !prev)
  }

  // 点击删除按钮
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
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
    <div
      onContextMenu={handleContextMenu}
      className="relative h-full rounded-2xl bg-card border border-border flex items-center justify-center cursor-grab hover:shadow-lg transition-all overflow-visible select-none"
    >
      {/* iOS 风格删除按钮 */}
      {showDelete && (
        <button
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-destructive hover:bg-destructive/80 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110"
          title="删除"
        >
          <X className="w-4 h-4 text-destructive-foreground" />
        </button>
      )}

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
  )
}
