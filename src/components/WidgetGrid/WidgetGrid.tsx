import { useState, useEffect, useRef } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import type { GridItem, SiteItem, WidgetItem } from './types'
import { isSiteItem, isAddSiteItem } from './types'
import { GRID_COLS, GRID_MARGIN, GRID_WIDTH, ROW_HEIGHT } from './constants'
import { getFaviconUrl, getSiteName } from './utils/favicon'
import {
  generatePageLayout,
  paginateItems,
  sortItemsByLayout,
  reorderItemsByPageLayout,
  LAYOUT_STORAGE_KEY,
  PAGE_ROWS,
} from './utils/layout'
import { db } from '@/lib/db'
import { WidgetCard, SiteCard, AddSiteCard } from './widgets'
import { AddSiteDialog } from './AddSiteDialog'
import { EditFaviconDialog } from './EditFaviconDialog'
import { presetSites, fixedWidgets, iconMap } from './data'

// 恢复站点数据的图标组件
function restoreIcons(sites: SiteItem[]): SiteItem[] {
  return sites.map((site) => {
    if (site.id in iconMap) {
      return { ...site, icon: iconMap[site.id] }
    }
    return site
  })
}

export function WidgetGrid() {
  const [items, setItems] = useState<GridItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  // 编辑 favicon 相关状态
  const [editFaviconOpen, setEditFaviconOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null)

  // 拖拽状态追踪 - 用于区分点击和拖拽
  const isDraggingRef = useRef(false)
  const dragStartTimeRef = useRef<number | null>(null)

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
          isDraggingRef={isDraggingRef}
        />
      )
    }
    return <WidgetCard widget={item as WidgetItem} onDelete={() => handleDeleteItem(item.id)} />
  }

  // 处理拖拽开始
  const handleDragStart = () => {
    isDraggingRef.current = true
    dragStartTimeRef.current = Date.now()
  }

  // 处理拖拽停止
  const handleDragStop = () => {
    // 延迟重置，确保点击事件不会在拖拽后触发
    setTimeout(() => {
      isDraggingRef.current = false
      dragStartTimeRef.current = null
      
      // 拖拽停止时，确保布局被保存（防止布局丢失）
      // 使用当前的 items 生成布局并保存
      const globalLayout = generatePageLayout(items)
      db.settings.set(LAYOUT_STORAGE_KEY, globalLayout).catch((err) => {
        console.error('Failed to save layout on drag stop:', err)
      })
    }, 100)
  }

  // 处理页面内布局变化 - 保存布局并更新 items 顺序
  const handlePageLayoutChange = (pageIndex: number, newLayout: Layout[]) => {
    const { newItems, orderChanged } = reorderItemsByPageLayout(items, pages, pageIndex, newLayout)

    // 如果顺序变化，更新 items
    if (orderChanged) {
      setItems(newItems)
    }

    // 无论顺序是否变化，都要保存布局（因为位置可能改变了）
    // 使用最新的 items（如果顺序变化了就用 newItems，否则用当前的 items）
    const itemsToSave = orderChanged ? newItems : items
    const globalLayout = generatePageLayout(itemsToSave)
    db.settings.set(LAYOUT_STORAGE_KEY, globalLayout).catch((err) => {
      console.error('Failed to save layout:', err)
    })
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
                  onDragStart={handleDragStart}
                  onDragStop={handleDragStop}
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
