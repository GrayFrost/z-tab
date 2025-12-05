import { Plus } from 'lucide-react'
import {
  BrandGithub,
  BrandV2ex,
  BrandJuejin,
  BrandBilibili,
  BrandYoutubeFilled,
  BrandDouban,
  BrandReddit,
  BrandTaobao,
  BrandAppleFilled,
} from '@/svg/icon-collection'
import type { SiteItem, WidgetItem } from './types'
import type { ComponentType, SVGProps } from 'react'

// 图标映射表
export const iconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  github: BrandGithub,
  juejin: BrandJuejin,
  v2ex: BrandV2ex,
  bilibili: BrandBilibili,
  youtube: BrandYoutubeFilled,
  douban: BrandDouban,
  taobao: BrandTaobao,
  apple: BrandAppleFilled,
}

// 预设网站
export const presetSites: SiteItem[] = [
  {
    id: 'github',
    size: '1x1',
    title: 'GitHub',
    url: 'https://github.com',
    favicon: '',
    icon: BrandGithub,
    type: 'site',
  },
  {
    id: 'juejin',
    size: '1x1',
    title: '稀土掘金',
    url: 'https://juejin.cn',
    favicon: '',
    icon: BrandJuejin,
    type: 'site',
  },
  {
    id: 'v2ex',
    size: '1x1',
    title: 'V2EX',
    url: 'https://www.v2ex.com',
    favicon: '',
    icon: BrandV2ex,
    type: 'site',
  },
  {
    id: 'bilibili',
    size: '1x1',
    title: 'Bilibili',
    url: 'https://www.bilibili.com',
    favicon: '',
    icon: BrandBilibili,
    type: 'site',
  },
  {
    id: 'youtube',
    size: '1x1',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    favicon: '',
    icon: BrandYoutubeFilled,
    type: 'site',
  },
  {
    id: 'douban',
    size: '1x1',
    title: '豆瓣',
    url: 'https://www.douban.com',
    favicon: '',
    icon: BrandDouban,
    type: 'site',
  },
  {
    id: 'reddit',
    size: '1x1',
    title: 'Reddit',
    url: 'https://www.reddit.com',
    favicon: '',
    icon: BrandReddit,
    type: 'site',
  },
  {
    id: 'taobao',
    size: '1x1',
    title: '淘宝',
    url: 'https://www.taobao.com',
    favicon: '',
    icon: BrandTaobao,
    type: 'site',
  },
  {
    id: 'apple',
    size: '1x1',
    title: 'Apple',
    url: 'https://www.apple.com',
    favicon: '',
    icon: BrandAppleFilled,
    type: 'site',
  },
]

// 固定组件（如添加按钮）
export const fixedWidgets: WidgetItem[] = [
  { id: 'add-site', size: '1x1', title: '添加网站', icon: Plus, type: 'add-site' },
]
