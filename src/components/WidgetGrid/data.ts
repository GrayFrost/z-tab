import { Plus } from 'lucide-react'
import {
  BrandGithub,
  BrandV2ex,
  BrandJuejin,
  BrandBilibili,
  BrandYoutubeFilled,
  BrandYoutubeFilledColorful,
  BrandDouban,
  BrandReddit,
  BrandTaobao,
  BrandAppleFilled,
  BrandWeibo,
  BrandWeiboColorful,
  BrandMedium,
  BrandDribbble,
  BrandFigma,
  BrandFigmaColorful,
  BrandGitlab,
  BrandSpotify,
  BrandX,
  BrandGmail,
  BrandFacebook,
  BrandFacebookColorful,
  BrandPinterest,
  BrandDiscord,
  BrandTwitch,
} from '@/svg/icon-collection'
import type { SiteItem, WidgetItem } from './types'
import type { ComponentType, SVGProps } from 'react'
import type { IconStyle } from '@/contexts/IconStyleContext'

// 简约风格图标映射表
export const minimalIconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  github: BrandGithub,
  juejin: BrandJuejin,
  v2ex: BrandV2ex,
  bilibili: BrandBilibili,
  youtube: BrandYoutubeFilled,
  douban: BrandDouban,
  reddit: BrandReddit,
  taobao: BrandTaobao,
  apple: BrandAppleFilled,
  weibo: BrandWeibo,
  medium: BrandMedium,
  dribbble: BrandDribbble,
  figma: BrandFigma,
  gitlab: BrandGitlab,
  spotify: BrandSpotify,
  x: BrandX,
  gmail: BrandGmail,
  facebook: BrandFacebook,
  pinterest: BrandPinterest,
  discord: BrandDiscord,
  twitch: BrandTwitch,
}

// 绚丽风格图标映射表（素材待定，先留空，会自动回退到简约风格）
export const colorfulIconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  // TODO: 添加绚丽风格的图标组件
  // github: BrandGithubColorful,
  // juejin: BrandJuejinColorful,
  // ...
  weibo: BrandWeiboColorful,
  youtube: BrandYoutubeFilledColorful,
  facebook: BrandFacebookColorful,
  figma: BrandFigmaColorful,
}

// 根据风格获取图标
export function getIconByStyle(
  id: string,
  style: IconStyle
): ComponentType<SVGProps<SVGSVGElement>> | undefined {
  if (style === 'colorful' && id in colorfulIconMap) {
    return colorfulIconMap[id]
  }
  // 绚丽模式没有对应图标时，回退到简约模式
  return minimalIconMap[id]
}

// 兼容旧代码的图标映射表（默认使用简约风格）
export const iconMap = minimalIconMap

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
  {
    id: 'weibo',
    size: '1x1',
    title: '微博',
    url: 'https://www.weibo.com',
    favicon: '',
    icon: BrandWeibo,
    type: 'site',
  },
  {
    id: 'medium',
    size: '1x1',
    title: 'Medium',
    url: 'https://www.medium.com',
    favicon: '',
    icon: BrandMedium,
    type: 'site',
  },
  {
    id: 'dribbble',
    size: '1x1',
    title: 'Dribbble',
    url: 'https://www.dribbble.com',
    favicon: '',
    icon: BrandDribbble,
    type: 'site',
  },
  {
    id: 'figma',
    size: '1x1',
    title: 'Figma',
    url: 'https://www.figma.com',
    favicon: '',
    icon: BrandFigma,
    type: 'site',
  },
  {
    id: 'gitlab',
    size: '1x1',
    title: 'GitLab',
    url: 'https://www.gitlab.com',
    favicon: '',
    icon: BrandGitlab,
    type: 'site',
  },
  {
    id: 'spotify',
    size: '1x1',
    title: 'Spotify',
    url: 'https://www.spotify.com',
    favicon: '',
    icon: BrandSpotify,
    type: 'site',
  },
  {
    id: 'x',
    size: '1x1',
    title: 'X',
    url: 'https://www.x.com',
    favicon: '',
    icon: BrandX,
    type: 'site',
  },
  {
    id: 'gmail',
    size: '1x1',
    title: 'Gmail',
    url: 'https://www.gmail.com',
    favicon: '',
    icon: BrandGmail,
    type: 'site',
  },
  {
    id: 'facebook',
    size: '1x1',
    title: 'Facebook',
    url: 'https://www.facebook.com',
    favicon: '',
    icon: BrandFacebook,
    type: 'site',
  },
  {
    id: 'pinterest',
    size: '1x1',
    title: 'Pinterest',
    url: 'https://www.pinterest.com',
    favicon: '',
    icon: BrandPinterest,
    type: 'site',
  },
  {
    id: 'discord',
    size: '1x1',
    title: 'Discord',
    url: 'https://www.discord.com',
    favicon: '',
    icon: BrandDiscord,
    type: 'site',
  },
  {
    id: 'twitch',
    size: '1x1',
    title: 'Twitch',
    url: 'https://www.twitch.com',
    favicon: '',
    icon: BrandTwitch,
    type: 'site',
  },
]

// 固定组件（如添加按钮）
export const fixedWidgets: WidgetItem[] = [
  { id: 'add-site', size: '1x1', title: '添加网站', icon: Plus, type: 'add-site' },
]
