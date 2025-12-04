import { useState, useMemo } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import type { GridItem, SiteItem, WidgetItem } from './types'
import { isSiteItem, isAddSiteItem } from './types'
import { GRID_COLS, GRID_MARGIN, GRID_WIDTH, ROW_HEIGHT, sizeToGrid } from './constants'
import { getFaviconUrl, getSiteName } from './utils/favicon'
import { saveSites, loadSites } from './utils/storage'
import { WidgetCard, SiteCard, AddSiteCard } from './widgets'
import { AddSiteDialog } from './AddSiteDialog'
import { presetSites, fixedWidgets, iconMap } from './data'

// 生成布局
function generateLayout(items: GridItem[]): Layout[] {
  let x = 0
  let y = 0

  return items.map((item) => {
    const { w, h } = sizeToGrid[item.size]

    // 如果当前行放不下，换到下一行
    if (x + w > GRID_COLS) {
      x = 0
      y += 1
    }

    // 禁用缩放
    const banResize = ['1x1', '2x1', '2x2', '4x2'].includes(item.size)
    // add-site 按钮固定位置，不可拖动
    const isStatic = item.type === 'add-site'

    const layout: Layout = {
      i: item.id,
      x,
      y,
      w,
      h,
      minW: 1,
      minH: 1,
      maxW: GRID_COLS,
      maxH: 4,
      isResizable: !banResize,
      isDraggable: !isStatic,
      static: isStatic,
    }

    x += w
    if (x >= GRID_COLS) {
      x = 0
      y += h
    }

    return layout
  })
}

// 恢复站点数据的图标组件
function restoreIcons(sites: SiteItem[]): SiteItem[] {
  return sites.map(site => {
    // 如果 id 在 iconMap 中，恢复图标组件
    if (site.id in iconMap) {
      return { ...site, icon: iconMap[site.id] }
    }
    return site
  })
}

// 初始化数据
function getInitialItems(): GridItem[] {
  const loadedSites = loadSites()
  
  // 如果 localStorage 中没有数据（返回空数组且 key 不存在），说明是首次访问
  // 这里我们需要判断 localStorage 是否真的为空，因为 loadSites 在出错或为空时都返回 []
  // 简单的判断方式是检查 localStorage.getItem('z-tab-sites') 是否为 null
  // 但由于 loadSites 封装了 storage 访问，我们暂时假定如果是空数组且需要预设，就用预设
  
  // 更好的做法：直接在组件 mount 时判断，如果 savedSites 为空，则写入预设
  
  let sites: SiteItem[] = []
  
  // 检查 localStorage 是否有数据
  const savedData = localStorage.getItem('z-tab-sites')
  
  // 如果没有数据，或者数据为空数组，都使用预设站点
  // 注意：这会覆盖用户手动清空所有站点的情况，如果用户想保持空列表，这种策略可能不合适
  // 但在开发阶段或者为了推广预设站点，这是可行的
  if (!savedData || savedData === '[]') {
    // 首次访问或列表为空，使用预设站点
    sites = [...presetSites]
    // 立即保存到 localStorage
    saveSites(sites)
  } else {
    // 从 localStorage 加载并恢复图标
    sites = restoreIcons(loadedSites)
  }

  return [...sites, ...fixedWidgets]
}

export function WidgetGrid() {
  const initialItems = useMemo(() => getInitialItems(), [])
  const [items, setItems] = useState<GridItem[]>(initialItems)
  const [layout, setLayout] = useState<Layout[]>(() => generateLayout(initialItems))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout)
  }

  const handleAddSite = () => {
    if (!urlInput.trim()) return

    // 确保 URL 有协议前缀
    let url = urlInput.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    const newSite: SiteItem = {
      id: `site-${Date.now()}`,
      size: '1x1',
      title: getSiteName(url),
      url: url,
      favicon: getFaviconUrl(url),
      type: 'site',
    }

    // 在 add-site 按钮之前插入新网站
    const addSiteIndex = items.findIndex(item => item.type === 'add-site')
    const newItems = [...items]
    // 如果没有找到 add-site 按钮（不应该发生），则添加到末尾
    if (addSiteIndex !== -1) {
      newItems.splice(addSiteIndex, 0, newSite)
    } else {
      newItems.push(newSite)
    }

    // 保存所有 site 类型的项目到 localStorage
    const allSites = newItems.filter(item => item.type === 'site') as SiteItem[]
    saveSites(allSites)

    setItems(newItems)
    setLayout(generateLayout(newItems))
    setUrlInput('')
    setDialogOpen(false)
  }

  const handleDeleteItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id)
    
    // 如果删除的是网站，同步更新 localStorage
    const allSites = newItems.filter(item => item.type === 'site') as SiteItem[]
    saveSites(allSites)

    setItems(newItems)
    setLayout(generateLayout(newItems))
  }

  const renderItem = (item: GridItem) => {
    if (isAddSiteItem(item)) {
      return <AddSiteCard onClick={() => setDialogOpen(true)} />
    }
    if (isSiteItem(item)) {
      return <SiteCard site={item} onDelete={() => handleDeleteItem(item.id)} />
    }
    return <WidgetCard widget={item as WidgetItem} onDelete={() => handleDeleteItem(item.id)} />
  }

  return (
    <div className="w-full mt-12 flex justify-center">
      <div style={{ width: GRID_WIDTH }}>
        <GridLayout
          className="layout"
          layout={layout}
          cols={GRID_COLS}
          rowHeight={ROW_HEIGHT}
          width={GRID_WIDTH}
          margin={[GRID_MARGIN, GRID_MARGIN]}
          containerPadding={[0, 0]}
          onLayoutChange={handleLayoutChange}
          isResizable={true}
          isDraggable={true}
          useCSSTransforms={true}
        >
          {items.map((item) => (
            <div key={item.id}>
              {renderItem(item)}
            </div>
          ))}
        </GridLayout>
      </div>

      <AddSiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        urlInput={urlInput}
        onUrlInputChange={setUrlInput}
        onSubmit={handleAddSite}
      />
    </div>
  )
}

