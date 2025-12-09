import { useState, useEffect } from 'react'
import { X, Pencil } from 'lucide-react'
import type { SiteItem } from '../types'
import { getNextFaviconUrl } from '../utils/favicon'
import { getIconByStyle } from '../data'
import { useIconStyle } from '@/contexts/IconStyleContext'
import { useDragAndClick } from '@/hooks/useDragAndClick'

interface SiteCardProps {
  site: SiteItem
  onDelete?: () => void
  onEditFavicon?: () => void
  isDraggingRef?: React.MutableRefObject<boolean>
}

export function SiteCard({ site, onDelete, onEditFavicon, isDraggingRef }: SiteCardProps) {
  // 优先使用 customFavicon
  const [currentFavicon, setCurrentFavicon] = useState(site.customFavicon || site.favicon)
  const [showFallback, setShowFallback] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { iconStyle } = useIconStyle()

  // 使用拖拽和点击检测 hook
  const { handleMouseDown } = useDragAndClick({
    onClick: () => {
      if (!showMenu) {
        window.open(site.url, '_blank')
      }
    },
    isDraggingRef,
    disabled: showMenu,
  })

  // 根据图标风格获取对应的图标组件
  const Icon = getIconByStyle(site.id, iconStyle)

  // 当 site 变化时更新 favicon
  useEffect(() => {
    setCurrentFavicon(site.customFavicon || site.favicon)
    setShowFallback(false)
  }, [site.customFavicon, site.favicon])

  // 点击其他地方时隐藏菜单
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = () => {
      setShowMenu(false)
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
  }, [showMenu])


  // 右键显示/隐藏菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu((prev) => !prev)
  }

  // 点击删除按钮
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onDelete?.()
  }

  // 点击编辑按钮
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onEditFavicon?.()
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
      onMouseDown={handleMouseDown}
      className="relative h-full rounded-2xl bg-card border border-border/50 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-visible select-none"
    >
      {/* 右键菜单按钮 */}
      {showMenu && (
        <>
          {/* 删除按钮 */}
          <button
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors"
            title="删除"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {/* 编辑图标按钮 */}
          <button
            onClick={handleEdit}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
            title="修改图标"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </>
      )}

      {/* 中心区域 - 现在整个卡片都可以拖拽和点击 */}
      <div
        className="w-14 h-14 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200 rounded-xl pointer-events-none"
        title={`打开 ${site.title}`}
      >
        {Icon ? (
          <Icon className="w-10 h-10 text-foreground" />
        ) : showFallback ? (
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
