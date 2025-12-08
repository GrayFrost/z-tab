import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { db } from '@/lib/db'

export type IconStyle = 'minimal' | 'colorful'

interface IconStyleContextType {
  iconStyle: IconStyle
  setIconStyle: (style: IconStyle) => void
  isLoaded: boolean
}

const IconStyleContext = createContext<IconStyleContextType | undefined>(undefined)

const ICON_STYLE_KEY = 'icon-style'

export function IconStyleProvider({ children }: { children: ReactNode }) {
  const [iconStyle, setIconStyleState] = useState<IconStyle>('minimal')
  const [isLoaded, setIsLoaded] = useState(false)

  // 从 IndexedDB 加载设置
  useEffect(() => {
    db.settings.get(ICON_STYLE_KEY).then((saved) => {
      if (saved === 'minimal' || saved === 'colorful') {
        setIconStyleState(saved)
      }
      setIsLoaded(true)
    })
  }, [])

  // 设置图标风格并保存到 IndexedDB
  const setIconStyle = (style: IconStyle) => {
    setIconStyleState(style)
    db.settings.set(ICON_STYLE_KEY, style)
  }

  return (
    <IconStyleContext.Provider value={{ iconStyle, setIconStyle, isLoaded }}>
      {children}
    </IconStyleContext.Provider>
  )
}

export function useIconStyle() {
  const context = useContext(IconStyleContext)
  if (context === undefined) {
    throw new Error('useIconStyle must be used within an IconStyleProvider')
  }
  return context
}

