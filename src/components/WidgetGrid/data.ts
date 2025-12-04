import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  CloudSun,
  FileText,
  Target,
  Settings,
  Plus,
} from 'lucide-react'
import type { GridItem } from './types'

// 默认组件数据
export const defaultWidgets: GridItem[] = [
  // { id: 'banner', size: '4x2', title: '大型横幅组件', icon: LayoutDashboard, type: 'widget' },
  // { id: 'medium', size: '2x2', title: '中等组件', icon: TrendingUp, type: 'widget' },
  // { id: 'wide', size: '2x1', title: '横向组件', icon: Clock, type: 'widget' },
  // { id: 'small1', size: '1x1', title: '天气', icon: CloudSun, type: 'widget' },
  // { id: 'small2', size: '1x1', title: '笔记', icon: FileText, type: 'widget' },
  // { id: 'small3', size: '1x1', title: '目标', icon: Target, type: 'widget' },
  // { id: 'small4', size: '1x1', title: '设置', icon: Settings, type: 'widget' },
  { id: 'add-site', size: '1x1', title: '添加网站', icon: Plus, type: 'add-site' },
]

