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
import { defaultWidgets } from './data'

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

// 初始化数据：合并默认 widgets 和已保存的 sites
function getInitialItems(): GridItem[] {
  const savedSites = loadSites()
  // 找到 add-site 按钮的位置，在它之前插入已保存的网站
  const addSiteIndex = defaultWidgets.findIndex(item => item.type === 'add-site')
  const items = [...defaultWidgets]
  items.splice(addSiteIndex, 0, ...savedSites)
  return items
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
    newItems.splice(addSiteIndex, 0, newSite)

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

