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

const LAYOUT_STORAGE_KEY = 'widget-layout'

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
        // 1. 尝试从 IndexedDB 加载站点数据
        let sites = await db.sites.getAll()
        
        // 2. 如果 DB 为空，检查 localStorage 是否有数据（迁移旧数据）
        if (sites.length === 0) {
          const localData = loadSites() // 这里是旧的 localStorage 方法
          if (localData.length > 0) {
            console.log('Migrating data from localStorage to IndexedDB...')
            sites = localData
            await db.sites.saveAll(sites)
          } else {
            // 3. 如果都没有数据，使用预设数据
            console.log('Initializing with preset sites...')
            sites = [...presetSites]
            await db.sites.saveAll(sites)
          }
        }

        // 4. 恢复图标并设置初始 Items
        const restoredSites = restoreIcons(sites)
        const initialItems = [...restoredSites, ...fixedWidgets]
        setItems(initialItems)

        // 5. 尝试加载保存的布局
        const savedLayout = await db.settings.get(LAYOUT_STORAGE_KEY)
        let initialLayout: Layout[] = []

        if (savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) {
          // 过滤掉布局中存在但 items 中不存在的项目（虽然很少见）
          // 并且确保所有 items 都有布局
          const itemIds = new Set(initialItems.map(i => i.id))
          const validSavedLayout = savedLayout.filter(l => itemIds.has(l.i))
          
          // 检查是否有新添加的 item 没有在保存的布局中
          const missingLayoutItems = initialItems.filter(item => !validSavedLayout.find(l => l.i === item.id))
          
          if (missingLayoutItems.length > 0) {
            // 为缺失的项目生成默认布局，并合并
            const defaultLayout = generateLayout(initialItems)
            // 这里简单合并，实际可能需要更复杂的算法寻找空位，但在 generateLayout 中已处理重叠问题
            // 我们优先保留保存的布局位置
            initialLayout = [
                ...validSavedLayout,
                ...defaultLayout.filter(l => missingLayoutItems.some(item => item.id === l.i))
            ]
          } else {
            initialLayout = validSavedLayout
          }
        } else {
           // 没有保存的布局，生成默认布局
           initialLayout = generateLayout(initialItems)
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
    setLayout(newLayout)
    // 保存布局到 IndexedDB
    db.settings.set(LAYOUT_STORAGE_KEY, newLayout).catch(err => {
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
    // 生成新布局时，需要考虑现有布局
    // 简单的做法是让 react-grid-layout 处理新加入的 item（它会自动放到最后）
    // 这里重新生成布局可能会打乱之前的顺序，所以我们不应该完全重新 generateLayout
    // 我们只需要把新的 items 传给 GridLayout，它会自动处理新增项。
    // 但为了确保状态同步，我们可以在这里更新 layout state，保留原有的，为新的添加默认位置
    
    // 实际上，如果不显式更新 layout，GridLayout 会自动添加新 item 到底部。
    // 但为了能够持久化，我们需要获取到新的 layout。handleLayoutChange 会被触发吗？
    // 添加 item 后，GridLayout 会触发 onLayoutChange。所以这里我们其实不需要手动 generateLayout
    // 除非我们需要控制新 item 的初始位置。
    
    // 既然之前的代码是全量重新 generate，这会导致重置。
    // 我们应该只添加新 item 到 layout，或者让 GridLayout 自己处理。
    // 这里为了稳妥，我们先不手动调用 setLayout(generateLayout)，而是让 GridLayout 自动处理
    // 或者我们手动计算新 item 的位置。
    
    // 简化处理：我们只更新 items。GridLayout 会检测到新 item，如果 layout 中没有对应的 i，
    // 它会自动添加到 (0,0) 或第一个空位。然后触发 onLayoutChange，我们在那里保存。
    
    // *修正*：之前的代码在 handleAddSite 里调用了 generateLayout，这会重置所有位置！
    // 我们应该移除这里的 setLayout 调用，或者智能合并。
    // 但 items 变了，如果不传新的 layout prop，可能会有问题。
    // 其实 react-grid-layout 只要 key 匹配，会自动保留已知 item 的位置。
    // 对于新 item，我们给它一个初始 layout 数据。
    
    // 找到合适的位置太复杂，这里先不传，让库自己找。
    // 但我们需要确保不重置旧的。
    
    // 之前的逻辑：
    // setLayout(generateLayout(newItems)) -> 这绝对是重置布局的元凶。
    
    // 新的逻辑：只更新 items，不手动重置 layout。
    // 但为了更好的体验，我们可以把新 item 放到 add-site 按钮之前的位置（如果可能）。
    // 简单起见，这里只 setUrlInput 和 setDialogOpen，layout 更新交给 handleLayoutChange 回调。
    
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
    // 删除时，移除对应的 layout
    const newLayout = layout.filter(l => l.i !== id)
    setLayout(newLayout)
    // 保存新布局
    db.settings.set(LAYOUT_STORAGE_KEY, newLayout)
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
