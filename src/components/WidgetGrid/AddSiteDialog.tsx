import { KeyboardEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AddSiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  urlInput: string
  onUrlInputChange: (value: string) => void
  onSubmit: () => void
}

export function AddSiteDialog({
  open,
  onOpenChange,
  urlInput,
  onUrlInputChange,
  onSubmit,
}: AddSiteDialogProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加网站快捷入口</DialogTitle>
          <DialogDescription>
            输入网站地址，将会自动获取网站图标
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <Input
            placeholder="输入网址，例如：github.com"
            value={urlInput}
            onChange={(e) => onUrlInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={onSubmit}>
              添加
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

