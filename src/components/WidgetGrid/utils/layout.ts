import type { Layout } from 'react-grid-layout'
import type { GridItem } from '../types'
import { GRID_COLS, sizeToGrid } from '../constants'

// 每页固定 4 行
export const PAGE_ROWS = 4

// 每页最多容纳的 1x1 单元格数量
export const CELLS_PER_PAGE = PAGE_ROWS * GRID_COLS

// 布局存储键
export const LAYOUT_STORAGE_KEY = 'widget-layout'

/**
 * 生成单页布局（从左到右，从上到下）
 */
export function generatePageLayout(items: GridItem[]): Layout[] {
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

/**
 * 将 items 分成多页
 */
export function paginateItems(items: GridItem[]): GridItem[][] {
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

/**
 * 根据保存的布局顺序对 items 进行排序
 */
export function sortItemsByLayout(items: GridItem[], savedLayout: Layout[]): GridItem[] {
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

/**
 * 根据新布局重新排序指定页的 items，并重建完整的 items 数组
 */
export function reorderItemsByPageLayout(
  allItems: GridItem[],
  pages: GridItem[][],
  pageIndex: number,
  newLayout: Layout[]
): { newItems: GridItem[]; orderChanged: boolean } {
  // 获取当前页的 items
  const currentPageItems = pages[pageIndex]
  if (!currentPageItems) {
    return { newItems: allItems, orderChanged: false }
  }

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
  const addSiteItem = allItems.find((item) => item.type === 'add-site')
  if (addSiteItem) {
    newItems.push(addSiteItem)
  }

  // 检查顺序是否变化
  const orderChanged = newItems.some((item, idx) => {
    const oldItem = allItems.find((i) => i.id === item.id)
    const oldIdx = allItems.indexOf(oldItem!)
    return oldIdx !== idx
  })

  return { newItems, orderChanged }
}

