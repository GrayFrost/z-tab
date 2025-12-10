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
  mergePageLayoutIntoGlobal,
  extractPageLayoutFromGlobal,
  LAYOUT_STORAGE_KEY,
  PAGE_ROWS,
} from './utils/layout'
import { db } from '@/lib/db'
import { WidgetCard, SiteCard, AddSiteCard } from './widgets'
import { AddSiteDialog } from './AddSiteDialog'
import { EditFaviconDialog } from './EditFaviconDialog'
import { WidgetDrawer } from './WidgetDrawer'
import { presetSites, fixedWidgets, iconMap, availableWidgets } from './data'

// 恢复站点数据的图标组件
function restoreIcons(sites: SiteItem[]): SiteItem[] {
  return sites.map((site) => {
    if (site.id in iconMap) {
      return { ...site, icon: iconMap[site.id] }
    }
    return site
  })
}

// 恢复组件数据的图标组件（从 IndexedDB 加载的 widgets 没有 icon）
function restoreWidgetIcons(widgets: Omit<WidgetItem, 'icon'>[]): WidgetItem[] {
  const widgetMap = new Map(availableWidgets.map((w) => [w.id.split('-')[0], w]))
  return widgets.map((widget) => {
    // 从id中提取基础id（去掉时间戳）
    const baseId = widget.id.split('-')[0]
    const template = widgetMap.get(baseId)
    if (template) {
      return { ...widget, icon: template.icon } as WidgetItem
    }
    // 如果找不到模板，返回一个默认图标（不应该发生，但为了类型安全）
    return { ...widget, icon: availableWidgets[0]?.icon || availableWidgets[0]?.icon } as WidgetItem
  })
}

interface WidgetGridProps {
  widgetDrawerOpen?: boolean
  onWidgetDrawerOpenChange?: (open: boolean) => void
}

export function WidgetGrid({ widgetDrawerOpen = false, onWidgetDrawerOpenChange }: WidgetGridProps = {}) {
  const [items, setItems] = useState<GridItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [savedGlobalLayout, setSavedGlobalLayout] = useState<Layout[] | null>(null)

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
        let widgets = await db.widgets.getAll()
        let shouldResetLayout = false

        if (sites.length === 0) {
          console.log('Initializing with preset sites...')
          sites = [...presetSites]
          const sitesToSave = sites.map(({ icon, ...rest }) => rest) as SiteItem[]
          await db.sites.saveAll(sitesToSave)
          shouldResetLayout = true
        }

        const restoredSites = restoreIcons(sites)
        const restoredWidgets = restoreWidgetIcons(widgets)
        let initialItems: GridItem[] = [...restoredSites, ...restoredWidgets, ...fixedWidgets]

        // 尝试加载保存的布局并按布局顺序排序 items
        let savedLayout: Layout[] | null = null
        if (!shouldResetLayout) {
          savedLayout = await db.settings.get(LAYOUT_STORAGE_KEY)
          if (savedLayout && Array.isArray(savedLayout) && savedLayout.length > 0) {
            initialItems = sortItemsByLayout(initialItems, savedLayout)
            setSavedGlobalLayout(savedLayout)
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
    setSavedGlobalLayout(globalLayout)
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
    if (itemToDelete) {
      if (isSiteItem(itemToDelete)) {
        try {
          await db.sites.delete(id)
        } catch (error) {
          console.error('Failed to delete site:', error)
        }
      } else if (itemToDelete.type === 'widget') {
        try {
          await db.widgets.delete(id)
        } catch (error) {
          console.error('Failed to delete widget:', error)
        }
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

  const handleAddWidget = async (widget: WidgetItem) => {
    // 生成唯一的widget id（如果widget已经有唯一id则使用，否则添加时间戳）
    const newWidget: WidgetItem = {
      ...widget,
      id: widget.id.includes('-') ? widget.id : `${widget.id}-${Date.now()}`,
    }

    // 在 add-site 按钮之前插入新widget
    const addSiteIndex = items.findIndex((item) => item.type === 'add-site')
    const newItems = [...items]
    if (addSiteIndex !== -1) {
      newItems.splice(addSiteIndex, 0, newWidget)
    } else {
      newItems.push(newWidget)
    }

    setItems(newItems)

    // 保存 widget 到 IndexedDB（不保存icon，因为icon是函数无法序列化）
    try {
      const { icon, ...widgetToSave } = newWidget
      await db.widgets.add(widgetToSave)
    } catch (err) {
      console.error('Failed to save widget to IndexedDB:', err)
    }

    // 保存新布局到 IndexedDB
    const globalLayout = generatePageLayout(newItems)
    setSavedGlobalLayout(globalLayout)
    try {
      await db.settings.set(LAYOUT_STORAGE_KEY, globalLayout)
    } catch (err) {
      console.error('Failed to save layout to IndexedDB:', err)
    }

    // 如果添加后创建了新页，滚动到新页
    const newPages = paginateItems(newItems)
    if (newPages.length > totalPages) {
      setTimeout(() => scrollToPage(newPages.length - 1), 100)
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
      // 使用最新的 items 和保存的布局状态
      setItems((currentItems) => {
        setSavedGlobalLayout((currentLayout) => {
          if (currentLayout) {
            // 如果已经有保存的布局，直接保存（因为 handlePageLayoutChange 已经更新了）
            db.settings.set(LAYOUT_STORAGE_KEY, currentLayout).catch((err) => {
              console.error('Failed to save layout on drag stop:', err)
            })
          } else {
            // 如果没有保存的布局，生成新的
            const globalLayout = generatePageLayout(currentItems)
            setSavedGlobalLayout(globalLayout)
            db.settings.set(LAYOUT_STORAGE_KEY, globalLayout).catch((err) => {
              console.error('Failed to save layout on drag stop:', err)
            })
          }
          return currentLayout
        })
        return currentItems
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
    // 合并当前页的布局到全局布局中，保留实际的 x, y 坐标
    const itemsToSave = orderChanged ? newItems : items
    const newPages = paginateItems(itemsToSave)
    const mergedLayout = mergePageLayoutIntoGlobal(
      itemsToSave,
      newPages,
      pageIndex,
      newLayout,
      savedGlobalLayout || undefined
    )
    
    // 保存合并后的全局布局
    setSavedGlobalLayout(mergedLayout)
    db.settings.set(LAYOUT_STORAGE_KEY, mergedLayout).catch((err) => {
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
                  layout={
                    savedGlobalLayout
                      ? extractPageLayoutFromGlobal(pageItems, savedGlobalLayout)
                      : generatePageLayout(pageItems)
                  }
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

      <WidgetDrawer
        open={widgetDrawerOpen}
        onOpenChange={onWidgetDrawerOpenChange || (() => {})}
        onAddWidget={handleAddWidget}
      />
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
