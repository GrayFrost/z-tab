import { useState, useEffect, KeyboardEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { SiteItem } from './types'

interface EditFaviconDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site: SiteItem | null
  onSubmit: (siteId: string, faviconUrl: string) => void
}

export function EditFaviconDialog({ open, onOpenChange, site, onSubmit }: EditFaviconDialogProps) {
  const [faviconUrl, setFaviconUrl] = useState('')
  const [previewError, setPreviewError] = useState(false)

  // 当 site 变化时，初始化输入框
  useEffect(() => {
    if (site) {
      setFaviconUrl(site.customFavicon || '')
      setPreviewError(false)
    }
  }, [site])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && faviconUrl.trim()) {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (site && faviconUrl.trim()) {
      onSubmit(site.id, faviconUrl.trim())
      onOpenChange(false)
    }
  }

  const handleClear = () => {
    if (site) {
      onSubmit(site.id, '') // 传空字符串表示清除自定义 favicon
      onOpenChange(false)
    }
  }

  const handlePreviewError = () => {
    setPreviewError(true)
  }

  const handleUrlChange = (value: string) => {
    setFaviconUrl(value)
    setPreviewError(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改网站图标</DialogTitle>
          <DialogDescription>
            输入自定义图标的 URL 地址（支持 ico、png、svg 等格式）
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          {/* 预览区域 */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
              {faviconUrl && !previewError ? (
                <img
                  src={faviconUrl}
                  alt="预览"
                  className="w-8 h-8 object-contain"
                  onError={handlePreviewError}
                />
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">
                  {site?.title.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{site?.title}</p>
              <p className="text-sm text-muted-foreground truncate">{site?.url}</p>
            </div>
          </div>

          <Input
            placeholder="输入图标 URL，例如：https://example.com/icon.png"
            value={faviconUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />

          {previewError && faviconUrl && (
            <p className="text-sm text-destructive">图标加载失败，请检查 URL 是否正确</p>
          )}

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={!site?.customFavicon}
              className="text-muted-foreground"
            >
              恢复默认
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={!faviconUrl.trim() || previewError}>
                保存
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
