import type { LucideIcon } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

export type WidgetSize = '1x1' | '2x1' | '2x2' | '4x2'
export type WidgetType = 'widget' | 'site' | 'add-site'

export interface WidgetItem {
  id: string
  size: WidgetSize
  title: string
  icon: LucideIcon
  type: WidgetType
}

export interface SiteItem {
  id: string
  size: WidgetSize
  title: string
  url: string
  favicon: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  type: WidgetType
}

export type GridItem = WidgetItem | SiteItem

// 类型守卫
export function isSiteItem(item: GridItem): item is SiteItem {
  return item.type === 'site'
}

export function isAddSiteItem(item: GridItem): boolean {
  return item.type === 'add-site'
}

