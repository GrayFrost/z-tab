import { useState } from 'react'
import type { SiteItem } from '../types'
import { getNextFaviconUrl } from '../utils/favicon'
import { DeleteButton } from './DeleteButton'

interface SiteCardProps {
  site: SiteItem
  onDelete?: () => void
}

export function SiteCard({ site, onDelete }: SiteCardProps) {
  const [currentFavicon, setCurrentFavicon] = useState(site.favicon)
  const [showFallback, setShowFallback] = useState(false)

  const handleClick = () => {
    window.open(site.url, '_blank')
  }

  const handleImageError = () => {
    // 尝试下一个 favicon 源
    const nextUrl = getNextFaviconUrl(site.url, currentFavicon)
    if (nextUrl) {
      setCurrentFavicon(nextUrl)
    } else {
      // 所有源都失败，显示首字母
      setShowFallback(true)
    }
  }

  return (
    <div
      onClick={handleClick}
      className="relative h-full rounded-2xl bg-card border border-border flex items-center justify-center cursor-pointer hover:scale-105 hover:shadow-lg transition-all group overflow-visible"
      title={site.title}
    >
      {onDelete && <DeleteButton onDelete={onDelete} />}
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
  )
}

