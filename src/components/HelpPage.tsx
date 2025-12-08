import { ArrowLeft, Search, Globe, Palette, Moon, Sun, Grid3X3, Plus, Settings, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HelpPageProps {
  onBack: () => void
}

export function HelpPage({ onBack }: HelpPageProps) {
  const features = [
    {
      icon: Search,
      title: '多搜索引擎支持',
      description: '支持 Google、百度、Bing、Yahoo 四大搜索引擎，一键切换，自动记住你的选择。',
    },
    {
      icon: Globe,
      title: '快捷网站导航',
      description: '预设常用网站快捷入口，点击即可快速访问。支持自定义添加你常用的网站。',
    },
    {
      icon: Plus,
      title: '自定义添加网站',
      description: '点击「+」按钮添加新网站，自动获取网站图标。也可以手动编辑网站的 favicon。',
    },
    {
      icon: GripVertical,
      title: '自由拖拽布局',
      description: '所有网站卡片都可以自由拖拽排列，打造属于你的个性化布局，布局自动保存。',
    },
    {
      icon: Palette,
      title: '主题切换',
      description: '支持日间/夜间主题切换，右上角点击即可切换，呵护你的眼睛。',
    },
    {
      icon: Settings,
      title: '数据管理',
      description: '支持一键重置，恢复到初始状态。所有数据存储在本地，保护你的隐私。',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-background transition-colors duration-300">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-8 gap-2 hover:bg-card hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Button>

        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-6 shadow-lg shadow-indigo-500/25">
            <Grid3X3 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Z-Tab 功能指南
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            一个简洁美观的新标签页，让你的浏览体验更加高效
          </p>
        </div>

        {/* 功能列表 */}
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-border transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 小贴士 */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">小贴士</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 右键点击网站卡片可以编辑或删除</li>
                <li>• 拖拽卡片可以调整位置</li>
                <li>• 所有设置自动保存，无需手动操作</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 版本信息 */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Z-Tab v1.0.0</p>
          <p className="mt-1">Made with ❤️</p>
        </div>
      </div>
    </div>
  )
}

