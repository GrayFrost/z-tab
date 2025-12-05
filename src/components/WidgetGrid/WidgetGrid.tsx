import { useState, useEffect, useRef } from 'react'
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

// 每页固定 4 行
const PAGE_ROWS = 4
// 每页最多容纳的 1x1 单元格数量
const CELLS_PER_PAGE = PAGE_ROWS * GRID_COLS

// 生成单页布局（从左到右，从上到下）
function generatePageLayout(items: GridItem[]): Layout[] {
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
      maxH: PAGE_ROWS,
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

// 将 items 分成多页
function paginateItems(items: GridItem[]): GridItem[][] {
  const pages: GridItem[][] = []
  let currentPage: GridItem[] = []
  let currentCells = 0

  // 分离出 add-site 按钮
  const addSiteItem = items.find((item) => item.type === 'add-site')
  const otherItems = items.filter((item) => item.type !== 'add-site')

  for (const item of otherItems) {
    const { w, h } = sizeToGrid[item.size]
    const cellsNeeded = w * h

    // 如果当前页放不下这个 item，开始新的一页
    if (currentCells + cellsNeeded > CELLS_PER_PAGE) {
      if (currentPage.length > 0) {
        pages.push(currentPage)
      }
      currentPage = []
      currentCells = 0
    }

    currentPage.push(item)
    currentCells += cellsNeeded
  }

  // 处理最后一页和 add-site 按钮
  if (addSiteItem) {
    const addSiteCells = 1 // add-site 是 1x1
    if (currentCells + addSiteCells <= CELLS_PER_PAGE) {
      // add-site 可以放在当前页
      currentPage.push(addSiteItem)
    } else {
      // 需要新开一页放 add-site
      if (currentPage.length > 0) {
        pages.push(currentPage)
      }
      currentPage = [addSiteItem]
    }
  }

  // 添加最后一页
  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  return pages.length > 0 ? pages : [[]]
}

// 恢复站点数据的图标组件
function restoreIcons(sites: SiteItem[]): SiteItem[] {
  return sites.map((site) => {
    if (site.id in iconMap) {
      return { ...site, icon: iconMap[site.id] }
    }
    return site
  })
}

// 根据保存的布局顺序对 items 进行排序
function sortItemsByLayout(items: GridItem[], savedLayout: Layout[]): GridItem[] {
  if (!savedLayout || savedLayout.length === 0) return items

  // 创建一个 id -> 位置 的映射，按照 y * 1000 + x 计算位置值
  const positionMap = new Map<string, number>()
  savedLayout.forEach((l) => {
    positionMap.set(l.i, l.y * 1000 + l.x)
  })

  // 分离 add-site 按钮
  const addSiteItem = items.find((item) => item.type === 'add-site')
  const otherItems = items.filter((item) => item.type !== 'add-site')

  // 对 items 进行排序
  const sortedItems = [...otherItems].sort((a, b) => {
    const posA = positionMap.get(a.id) ?? Infinity
    const posB = positionMap.get(b.id) ?? Infinity
    return posA - posB
  })

  // add-site 按钮放最后
  if (addSiteItem) {
    sortedItems.push(addSiteItem)
  }

  return sortedItems
}

const LAYOUT_STORAGE_KEY = 'widget-layout'

export function WidgetGrid() {
  const [items, setItems] = useState<GridItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  // 编辑 favicon 相关状态
  const [editFaviconOpen, setEditFaviconOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null)

  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 分页数据
  const pages = paginateItems(items)
  const totalPages = pages.length

  // 初始化数据加载
  useEffect(() => {
    const initData = async () => {
      try {
        let sites = await db.sites.getAll()
        let shouldResetLayout = false

        if (sites.length === 0) {
          console.log('Initializing with preset sites...')
          sites = [...presetSites]
          const sitesToSave = sites.map(({ icon, ...rest }) => rest) as SiteItem[]
          await db.sites.saveAll(sitesToSave)
          shouldResetLayout = true
        }

        const restoredSites = restoreIcons(sites)
        let initialItems: GridItem[] = [...restoredSites, ...fixedWidgets]

        // 尝试加载保存的布局并按布局顺序排序 items
        if (!shouldResetLayout) {
          const savedLayout = await db.settings.get(LAYOUT_STORAGE_KEY)
          if (savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) {
            initialItems = sortItemsByLayout(initialItems, savedLayout)
          }
        }

        setItems(initialItems)
      } catch (error) {
        console.error('Failed to initialize data:', error)
        setItems([...fixedWidgets])
      } finally {
        setIsInitialized(true)
      }
    }

    initData()
  }, [])

  // 处理滚动到指定页（每页宽度 = 100vw）
  const scrollToPage = (pageIndex: number) => {
    if (scrollContainerRef.current) {
      const pageWidth = scrollContainerRef.current.clientWidth // 100vw
      scrollContainerRef.current.scrollTo({
        left: pageIndex * pageWidth,
        behavior: 'smooth',
      })
    }
    setCurrentPage(pageIndex)
  }

  // 监听滚动更新当前页码
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const pageWidth = scrollContainerRef.current.clientWidth // 100vw
      const scrollLeft = scrollContainerRef.current.scrollLeft
      const newPage = Math.round(scrollLeft / pageWidth)
      if (newPage !== currentPage && newPage >= 0 && newPage < totalPages) {
        setCurrentPage(newPage)
      }
    }
  }

  const handleAddSite = async () => {
    if (!urlInput.trim()) return

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

    try {
      await db.sites.add(newSite)
    } catch (error) {
      console.error('Failed to save site:', error)
    }

    setItems(newItems)
    setUrlInput('')
    setDialogOpen(false)

    // 保存新布局
    const globalLayout = generatePageLayout(newItems)
    db.settings.set(LAYOUT_STORAGE_KEY, globalLayout).catch((err) => {
      console.error('Failed to save layout:', err)
    })

    // 如果添加后创建了新页，滚动到新页
    const newPages = paginateItems(newItems)
    if (newPages.length > totalPages) {
      setTimeout(() => scrollToPage(newPages.length - 1), 100)
    }
  }

  const handleDeleteItem = async (id: string) => {
    const newItems = items.filter((item) => item.id !== id)

    const itemToDelete = items.find((item) => item.id === id)
    if (itemToDelete && isSiteItem(itemToDelete)) {
      try {
        await db.sites.delete(id)
      } catch (error) {
        console.error('Failed to delete site:', error)
      }
    }

    setItems(newItems)

    // 保存新布局
    const globalLayout = generatePageLayout(newItems)
    db.settings.set(LAYOUT_STORAGE_KEY, globalLayout).catch((err) => {
      console.error('Failed to save layout:', err)
    })

    // 如果删除后页数减少，调整当前页
    const newPages = paginateItems(newItems)
    if (currentPage >= newPages.length) {
      setCurrentPage(Math.max(0, newPages.length - 1))
    }
  }

  const handleEditFavicon = (site: SiteItem) => {
    setEditingSite(site)
    setEditFaviconOpen(true)
  }

  const handleUpdateFavicon = async (siteId: string, faviconUrl: string) => {
    const siteIndex = items.findIndex((item) => item.id === siteId && isSiteItem(item))
    if (siteIndex === -1) return

    const site = items[siteIndex] as SiteItem
    const updatedSite: SiteItem = {
      ...site,
      customFavicon: faviconUrl || undefined,
    }

    const newItems = [...items]
    newItems[siteIndex] = updatedSite
    setItems(newItems)

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

  // 处理页面内布局变化 - 保存布局并更新 items 顺序
  const handlePageLayoutChange = (pageIndex: number, newLayout: Layout[]) => {
    // 获取当前页的 items
    const currentPageItems = pages[pageIndex]
    if (!currentPageItems) return

    // 根据新布局对当前页的 items 进行排序
    const sortedPageItems = [...currentPageItems].sort((a, b) => {
      const layoutA = newLayout.find((l) => l.i === a.id)
      const layoutB = newLayout.find((l) => l.i === b.id)
      if (!layoutA || !layoutB) return 0
      // 按 y * 1000 + x 排序
      const posA = layoutA.y * 1000 + layoutA.x
      const posB = layoutB.y * 1000 + layoutB.x
      return posA - posB
    })

    // 重建完整的 items 数组
    const newItems: GridItem[] = []
    pages.forEach((page, idx) => {
      if (idx === pageIndex) {
        // 当前页使用新排序
        newItems.push(...sortedPageItems.filter((item) => item.type !== 'add-site'))
      } else {
        // 其他页保持原样
        newItems.push(...page.filter((item) => item.type !== 'add-site'))
      }
    })

    // add-site 按钮放最后
    const addSiteItem = items.find((item) => item.type === 'add-site')
    if (addSiteItem) {
      newItems.push(addSiteItem)
    }

    // 检查顺序是否变化
    const orderChanged = newItems.some((item, idx) => {
      const oldItem = items.find((i) => i.id === item.id)
      const oldIdx = items.indexOf(oldItem!)
      return oldIdx !== idx
    })

    if (orderChanged) {
      setItems(newItems)

      // 生成并保存全局布局
      const globalLayout = generatePageLayout(newItems)
      db.settings.set(LAYOUT_STORAGE_KEY, globalLayout).catch((err) => {
        console.error('Failed to save layout:', err)
      })
    }
  }

  if (!isInitialized) {
    return <div className="w-full mt-12 flex justify-center opacity-0">Loading...</div>
  }

  return (
    <div className="w-full h-full flex flex-col items-center">
      {/* 分页滚动容器 - 每页占满整个视口宽度 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-x-auto overflow-y-hidden scroll-smooth widget-scroll-container"
        onScroll={handleScroll}
        style={{ scrollSnapType: 'x mandatory' }}
      >
        <div
          className="flex h-full"
          style={{ width: `${totalPages * 100}vw` }}
        >
          {pages.map((pageItems, pageIndex) => (
            <div
              key={pageIndex}
              className="flex-shrink-0 w-screen h-full flex justify-center items-start pt-8"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Grid 容器水平居中，内容从左上开始排列 */}
              <div style={{ width: GRID_WIDTH }}>
                <GridLayout
                  className="layout"
                  layout={generatePageLayout(pageItems)}
                  cols={GRID_COLS}
                  rowHeight={ROW_HEIGHT}
                  width={GRID_WIDTH}
                  margin={[GRID_MARGIN, GRID_MARGIN]}
                  containerPadding={[0, 0]}
                  onLayoutChange={(layout) => handlePageLayoutChange(pageIndex, layout)}
                  isResizable={true}
                  isDraggable={true}
                  useCSSTransforms={true}
                  maxRows={PAGE_ROWS}
                  compactType="horizontal"
                >
                  {pageItems.map((item) => (
                    <div key={item.id}>{renderItem(item)}</div>
                  ))}
                </GridLayout>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 分页指示器 */}
      {totalPages > 1 && (
        <div className="flex gap-2 py-4">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToPage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentPage
                  ? 'bg-foreground/80 w-6'
                  : 'bg-foreground/20 hover:bg-foreground/40'
              }`}
              aria-label={`第 ${index + 1} 页`}
            />
          ))}
        </div>
      )}

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
