import { useState, useEffect } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import type { GridItem, SiteItem, WidgetItem } from './types'
import { isSiteItem, isAddSiteItem } from './types'
import { GRID_COLS, GRID_MARGIN, GRID_WIDTH, ROW_HEIGHT, sizeToGrid } from './constants'
import { getFaviconUrl, getSiteName } from './utils/favicon'
import { loadSites } from './utils/storage' // 仅用于迁移数据
import { db } from '@/lib/db'
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

export function WidgetGrid() {
  const [items, setItems] = useState<GridItem[]>([])
  const [layout, setLayout] = useState<Layout[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  // 初始化数据加载
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. 尝试从 IndexedDB 加载
        let sites = await db.sites.getAll()
        
        // 2. 如果 DB 为空，检查 localStorage 是否有数据（迁移旧数据）
        if (sites.length === 0) {
          const localData = loadSites() // 这里是旧的 localStorage 方法
          if (localData.length > 0) {
            console.log('Migrating data from localStorage to IndexedDB...')
            sites = localData
            await db.sites.saveAll(sites)
            // 可选：迁移后清除 localStorage
            // localStorage.removeItem('z-tab-sites')
          } else {
            // 3. 如果都没有数据，使用预设数据
            console.log('Initializing with preset sites...')
            sites = [...presetSites]
            await db.sites.saveAll(sites)
          }
        }

        // 4. 恢复图标并设置状态
        const restoredSites = restoreIcons(sites)
        const initialItems = [...restoredSites, ...fixedWidgets]
        setItems(initialItems)
        setLayout(generateLayout(initialItems))
      } catch (error) {
        console.error('Failed to initialize data:', error)
        // 出错时降级显示添加按钮
        setItems([...fixedWidgets])
      } finally {
        setIsInitialized(true)
      }
    }

    initData()
  }, [])

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout)
  }

  const handleAddSite = async () => {
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
    if (addSiteIndex !== -1) {
      newItems.splice(addSiteIndex, 0, newSite)
    } else {
      newItems.push(newSite)
    }

    // 保存到 IndexedDB
    try {
      await db.sites.add(newSite)
    } catch (error) {
      console.error('Failed to save site:', error)
    }

    setItems(newItems)
    setLayout(generateLayout(newItems))
    setUrlInput('')
    setDialogOpen(false)
  }

  const handleDeleteItem = async (id: string) => {
    const newItems = items.filter(item => item.id !== id)
    
    // 如果删除的是网站，同步更新 IndexedDB
    const itemToDelete = items.find(item => item.id === id)
    if (itemToDelete && isSiteItem(itemToDelete)) {
      try {
        await db.sites.delete(id)
      } catch (error) {
        console.error('Failed to delete site:', error)
      }
    }

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

  if (!isInitialized) {
    return <div className="w-full mt-12 flex justify-center opacity-0">Loading...</div>
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
