import { useState, useEffect } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import type { GridItem, SiteItem, WidgetItem } from './types'
import { isSiteItem, isAddSiteItem } from './types'
import { GRID_COLS, GRID_MARGIN, GRID_WIDTH, ROW_HEIGHT, sizeToGrid } from './constants'
import { getFaviconUrl, getSiteName } from './utils/favicon'
import { db } from '@/lib/db'
import { WidgetCard, SiteCard, AddSiteCard } from './widgets'
import { AddSiteDialog } from './AddSiteDialog'
import { EditFaviconDialog } from './EditFaviconDialog'
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
  return sites.map((site) => {
    // 如果 id 在 iconMap 中，恢复图标组件
    if (site.id in iconMap) {
      return { ...site, icon: iconMap[site.id] }
    }
    return site
  })
}

// 计算 add-site 按钮的最佳位置（始终在所有其他 widget 后面）
// 逻辑：找到最后一行，看这一行还有没有空间，有就放后面，没有就另起一行
function calculateAddSitePosition(layoutWithoutAddSite: Layout[]): { x: number; y: number } {
  if (layoutWithoutAddSite.length === 0) {
    return { x: 0, y: 0 }
  }

  // 1. 找到最大的 y 值（最后一行的行号）
  let maxY = 0
  layoutWithoutAddSite.forEach((item) => {
    // widget 占据的最底部行 = y + h - 1
    maxY = Math.max(maxY, item.y + item.h - 1)
  })

  // 2. 在最后一行，找到被占用的最大 x + w（最右边界）
  let maxXEndInLastRow = 0
  layoutWithoutAddSite.forEach((item) => {
    // 检查这个 widget 是否占据了最后一行
    // widget 占据的行范围是 [item.y, item.y + item.h - 1]
    const widgetBottomY = item.y + item.h - 1
    if (widgetBottomY >= maxY) {
      // 这个 widget 延伸到了最后一行，记录它的右边界
      maxXEndInLastRow = Math.max(maxXEndInLastRow, item.x + item.w)
    }
  })

  // 3. 判断最后一行是否还有空间
  if (maxXEndInLastRow < GRID_COLS) {
    // 最后一行还有空间，放在这一行的最后
    return { x: maxXEndInLastRow, y: maxY }
  } else {
    // 最后一行满了，另起一行
    return { x: 0, y: maxY + 1 }
  }
}

// 更新布局中 add-site 按钮的位置
function repositionAddSiteButton(currentLayout: Layout[]): Layout[] {
  const layoutWithoutAddSite = currentLayout.filter((l) => l.i !== 'add-site')
  const addSiteLayout = currentLayout.find((l) => l.i === 'add-site')

  if (!addSiteLayout) return currentLayout

  const { x, y } = calculateAddSitePosition(layoutWithoutAddSite)

  // 如果位置没变，直接返回
  if (addSiteLayout.x === x && addSiteLayout.y === y) {
    return currentLayout
  }

  return [...layoutWithoutAddSite, { ...addSiteLayout, x, y }]
}

const LAYOUT_STORAGE_KEY = 'widget-layout'

export function WidgetGrid() {
  const [items, setItems] = useState<GridItem[]>([])
  const [layout, setLayout] = useState<Layout[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  // 编辑 favicon 相关状态
  const [editFaviconOpen, setEditFaviconOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null)

  // 初始化数据加载
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. 尝试从 IndexedDB 加载站点数据
        let sites = await db.sites.getAll()
        let shouldResetLayout = false // 标记是否需要重置布局

        // 2. 如果 DB 为空，使用预设数据
        if (sites.length === 0) {
          console.log('Initializing with preset sites...')
          sites = [...presetSites]
          // 保存到 IndexedDB 前移除 icon（函数不能被序列化）
          const sitesToSave = sites.map(({ icon, ...rest }) => rest) as SiteItem[]
          await db.sites.saveAll(sitesToSave)
          // 使用预设数据时，需要重置布局
          shouldResetLayout = true
        }

        // 4. 恢复图标并设置初始 Items
        const restoredSites = restoreIcons(sites)
        const initialItems = [...restoredSites, ...fixedWidgets]
        setItems(initialItems)

        // 5. 确定使用的布局
        let initialLayout: Layout[] = []

        if (shouldResetLayout) {
          // 使用预设数据时，强制重新生成布局并清除旧的 layout 数据
          initialLayout = generateLayout(initialItems)
          await db.settings.set(LAYOUT_STORAGE_KEY, initialLayout)
        } else {
          // 尝试加载保存的布局
          const savedLayout = await db.settings.get(LAYOUT_STORAGE_KEY)

          if (savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) {
            // 过滤掉布局中存在但 items 中不存在的项目
            const itemIds = new Set(initialItems.map((i) => i.id))
            const validSavedLayout = savedLayout.filter((l) => itemIds.has(l.i))

            // 检查是否有新添加的 item 没有在保存的布局中
            const missingLayoutItems = initialItems.filter(
              (item) => !validSavedLayout.find((l) => l.i === item.id)
            )

            if (missingLayoutItems.length > 0) {
              // 为缺失的项目生成默认布局，并合并
              const defaultLayout = generateLayout(initialItems)
              initialLayout = [
                ...validSavedLayout,
                ...defaultLayout.filter((l) => missingLayoutItems.some((item) => item.id === l.i)),
              ]
            } else {
              initialLayout = validSavedLayout
            }
          } else {
            // 没有保存的布局，生成默认布局
            initialLayout = generateLayout(initialItems)
          }
        }

        setLayout(initialLayout)
      } catch (error) {
        console.error('Failed to initialize data:', error)
        // 出错时降级显示
        setItems([...fixedWidgets])
        setLayout(generateLayout([...fixedWidgets]))
      } finally {
        setIsInitialized(true)
      }
    }

    initData()
  }, [])

  const handleLayoutChange = (newLayout: Layout[]) => {
    // 每次布局变化后，重新定位 add-site 按钮到正确位置
    const adjustedLayout = repositionAddSiteButton(newLayout)
    setLayout(adjustedLayout)
    // 保存布局到 IndexedDB
    db.settings.set(LAYOUT_STORAGE_KEY, adjustedLayout).catch((err) => {
      console.error('Failed to save layout:', err)
    })
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
    const addSiteIndex = items.findIndex((item) => item.type === 'add-site')
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

    // 为新 item 创建 layout，放到 add-site 按钮的位置
    // 然后把 add-site 按钮往后挪
    const addSiteLayout = layout.find((l) => l.i === 'add-site')
    const newLayout = [...layout]

    // 新 item 的 layout
    const newItemLayout: Layout = {
      i: newSite.id,
      x: addSiteLayout?.x ?? 0,
      y: addSiteLayout?.y ?? 0,
      w: 1,
      h: 1,
      minW: 1,
      minH: 1,
      maxW: GRID_COLS,
      maxH: 4,
      isResizable: false, // 1x1 不可缩放
      isDraggable: true,
    }

    // 如果找到了 add-site 的布局，把它移到新位置
    if (addSiteLayout) {
      // 计算 add-site 按钮新位置（往后移一格）
      let newX = addSiteLayout.x + 1
      let newY = addSiteLayout.y
      if (newX >= GRID_COLS) {
        newX = 0
        newY += 1
      }
      // 更新 add-site 按钮的位置
      const addSiteLayoutIndex = newLayout.findIndex((l) => l.i === 'add-site')
      if (addSiteLayoutIndex !== -1) {
        newLayout[addSiteLayoutIndex] = {
          ...newLayout[addSiteLayoutIndex],
          x: newX,
          y: newY,
        }
      }
    }

    newLayout.push(newItemLayout)

    setItems(newItems)
    setLayout(newLayout)

    // 保存布局
    db.settings.set(LAYOUT_STORAGE_KEY, newLayout).catch((err) => {
      console.error('Failed to save layout:', err)
    })

    setUrlInput('')
    setDialogOpen(false)
  }

  const handleDeleteItem = async (id: string) => {
    const newItems = items.filter((item) => item.id !== id)

    // 如果删除的是网站，同步更新 IndexedDB
    const itemToDelete = items.find((item) => item.id === id)
    if (itemToDelete && isSiteItem(itemToDelete)) {
      try {
        await db.sites.delete(id)
      } catch (error) {
        console.error('Failed to delete site:', error)
      }
    }

    // 删除时，移除对应的 layout，并重新定位 add-site 按钮
    const layoutWithoutDeleted = layout.filter((l) => l.i !== id)
    const newLayout = repositionAddSiteButton(layoutWithoutDeleted)

    setItems(newItems)
    setLayout(newLayout)

    // 保存新布局到 IndexedDB
    try {
      await db.settings.set(LAYOUT_STORAGE_KEY, newLayout)
    } catch (error) {
      console.error('Failed to save layout after delete:', error)
    }
  }

  // 打开编辑 favicon 对话框
  const handleEditFavicon = (site: SiteItem) => {
    setEditingSite(site)
    setEditFaviconOpen(true)
  }

  // 更新 favicon
  const handleUpdateFavicon = async (siteId: string, faviconUrl: string) => {
    const siteIndex = items.findIndex((item) => item.id === siteId && isSiteItem(item))
    if (siteIndex === -1) return

    const site = items[siteIndex] as SiteItem
    const updatedSite: SiteItem = {
      ...site,
      customFavicon: faviconUrl || undefined, // 空字符串时清除自定义 favicon
    }

    // 更新 items 状态
    const newItems = [...items]
    newItems[siteIndex] = updatedSite
    setItems(newItems)

    // 同步到 IndexedDB（保存时移除 icon）
    try {
      const { icon, ...siteToSave } = updatedSite
      await db.sites.update(siteToSave as SiteItem)
    } catch (error) {
      console.error('Failed to update site favicon:', error)
    }
  }

  const renderItem = (item: GridItem) => {
    if (isAddSiteItem(item)) {
      return <AddSiteCard onClick={() => setDialogOpen(true)} />
    }
    if (isSiteItem(item)) {
      return (
        <SiteCard
          site={item}
          onDelete={() => handleDeleteItem(item.id)}
          onEditFavicon={() => handleEditFavicon(item)}
        />
      )
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
            <div key={item.id}>{renderItem(item)}</div>
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

      <EditFaviconDialog
        open={editFaviconOpen}
        onOpenChange={setEditFaviconOpen}
        site={editingSite}
        onSubmit={handleUpdateFavicon}
      />
    </div>
  )
}
