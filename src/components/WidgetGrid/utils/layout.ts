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
 * add-site 按钮总是排在最后一个widget后面
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

  // 对 items 进行排序（不包括 add-site）
  const sortedItems = [...otherItems].sort((a, b) => {
    const posA = positionMap.get(a.id) ?? Infinity
    const posB = positionMap.get(b.id) ?? Infinity
    return posA - posB
  })

  // add-site 按钮总是放在最后（在所有widget之后）
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

  // 重建完整的 items 数组（不包括 add-site）
  const newItems: GridItem[] = []
  pages.forEach((page, idx) => {
    if (idx === pageIndex) {
      // 当前页使用新排序（排除 add-site）
      newItems.push(...sortedPageItems.filter((item) => item.type !== 'add-site'))
    } else {
      // 其他页保持原样（排除 add-site）
      newItems.push(...page.filter((item) => item.type !== 'add-site'))
    }
  })

  // add-site 按钮总是放在最后（在所有widget之后）
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

/**
 * 合并当前页的布局到全局布局中，保留实际的 x, y 坐标
 */
export function mergePageLayoutIntoGlobal(
  allItems: GridItem[],
  pages: GridItem[][],
  pageIndex: number,
  pageLayout: Layout[],
  savedGlobalLayout?: Layout[]
): Layout[] {
  // 创建全局布局映射
  const globalLayoutMap = new Map<string, Layout>()
  
  // 如果有保存的全局布局，先加载它
  if (savedGlobalLayout) {
    savedGlobalLayout.forEach((layout) => {
      globalLayoutMap.set(layout.i, layout)
    })
  } else {
    // 否则生成默认布局
    const defaultLayout = generatePageLayout(allItems)
    defaultLayout.forEach((layout) => {
      globalLayoutMap.set(layout.i, layout)
    })
  }

  // 计算当前页之前的所有页的 items 数量，用于计算 y 偏移
  let yOffset = 0
  for (let i = 0; i < pageIndex; i++) {
    const pageItems = pages[i]
    if (pageItems) {
      // 计算这一页的最大 y 值
      let maxY = 0
      pageItems.forEach((item) => {
        const layout = globalLayoutMap.get(item.id)
        if (layout) {
          maxY = Math.max(maxY, layout.y + layout.h)
        }
      })
      yOffset += maxY
    }
  }

  // 更新当前页的布局，保留实际的 x, y 坐标（不包括 add-site）
  const addSiteLayouts: Layout[] = []
  pageLayout.forEach((layout) => {
    const item = allItems.find((i) => i.id === layout.i)
    if (item && item.type !== 'add-site') {
      const { w, h } = sizeToGrid[item.size]
      const banResize = ['1x1', '2x1', '2x2', '4x2'].includes(item.size)

      globalLayoutMap.set(layout.i, {
        ...layout,
        w,
        h,
        minW: 1,
        minH: 1,
        maxW: GRID_COLS,
        maxH: PAGE_ROWS,
        isResizable: !banResize,
        isDraggable: true,
        static: false,
        y: layout.y,
      })
    } else if (item && item.type === 'add-site') {
      // 保存 add-site 的布局，稍后处理
      addSiteLayouts.push(layout)
    }
  })
  
  // 对于 add-site 按钮，总是计算它在最后一个组件之后的位置
  const addSiteItem = allItems.find((item) => item.type === 'add-site')
  if (addSiteItem) {
    // 找到所有非 add-site 的布局，计算最后一个组件的位置
    const otherLayouts = Array.from(globalLayoutMap.values()).filter((l) => {
      const item = allItems.find((i) => i.id === l.i)
      return item && item.type !== 'add-site'
    })
    
    if (otherLayouts.length > 0) {
      // 找到最后一个组件的位置（最大的 y * 1000 + x）
      let maxY = -1
      let maxX = -1
      let lastLayout: Layout | null = null
      otherLayouts.forEach((layout) => {
        if (layout.y > maxY || (layout.y === maxY && layout.x > maxX)) {
          maxY = layout.y
          maxX = layout.x
          lastLayout = layout
        }
      })
      
      if (lastLayout) {
        // 计算 add-site 的位置：在最后一个组件之后
        let addSiteX = lastLayout.x + lastLayout.w
        let addSiteY = lastLayout.y
        
        // 如果右侧放不下，换到下一行
        if (addSiteX + 1 > GRID_COLS) {
          addSiteX = 0
          addSiteY = lastLayout.y + lastLayout.h
        }
        
        const { w, h } = sizeToGrid[addSiteItem.size]
        globalLayoutMap.set(addSiteItem.id, {
          i: addSiteItem.id,
          x: addSiteX,
          y: addSiteY,
          w,
          h,
          minW: 1,
          minH: 1,
          maxW: GRID_COLS,
          maxH: PAGE_ROWS,
          isResizable: false,
          isDraggable: false,
          static: true,
        })
      }
    }
  }

  // 返回全局布局数组
  return Array.from(globalLayoutMap.values())
}

/**
 * 从全局布局中提取指定页的布局
 * add-site 按钮的位置总是根据其他组件的位置动态计算
 */
export function extractPageLayoutFromGlobal(
  pageItems: GridItem[],
  globalLayout: Layout[]
): Layout[] {
  // 分离 add-site 按钮和其他组件
  const addSiteItem = pageItems.find((item) => item.type === 'add-site')
  const otherItems = pageItems.filter((item) => item.type !== 'add-site')
  
  // 获取其他组件的布局（使用保存的位置）
  const otherLayouts: Layout[] = []
  otherItems.forEach((item) => {
    const savedLayout = globalLayout.find((l) => l.i === item.id)
    if (savedLayout) {
      const { w, h } = sizeToGrid[item.size]
      const banResize = ['1x1', '2x1', '2x2', '4x2'].includes(item.size)
      otherLayouts.push({
        ...savedLayout,
        w,
        h,
        minW: 1,
        minH: 1,
        maxW: GRID_COLS,
        maxH: PAGE_ROWS,
        isResizable: !banResize,
        isDraggable: true,
        static: false,
      })
    }
  })
  
  // 如果其他组件都有保存的布局，计算 add-site 的位置
  if (otherLayouts.length === otherItems.length && addSiteItem) {
    // 找到最后一个组件的位置（最大的 y，如果 y 相同则最大的 x）
    let maxY = -1
    let maxX = -1
    let lastLayout: Layout | null = null
    otherLayouts.forEach((layout) => {
      if (layout.y > maxY || (layout.y === maxY && layout.x > maxX)) {
        maxY = layout.y
        maxX = layout.x
        lastLayout = layout
      }
    })
    
    // 计算 add-site 的位置：在最后一个组件之后
    let addSiteX = 0
    let addSiteY = maxY
    
    if (lastLayout) {
      // add-site 放在最后一个组件的右侧
      addSiteX = lastLayout.x + lastLayout.w
      // 如果右侧放不下，换到下一行
      if (addSiteX + 1 > GRID_COLS) {
        addSiteX = 0
        addSiteY = maxY + lastLayout.h
      }
    }
    
    const { w, h } = sizeToGrid[addSiteItem.size]
    const addSiteLayout: Layout = {
      i: addSiteItem.id,
      x: addSiteX,
      y: addSiteY,
      w,
      h,
      minW: 1,
      minH: 1,
      maxW: GRID_COLS,
      maxH: PAGE_ROWS,
      isResizable: false,
      isDraggable: false,
      static: true,
    }
    
    return [...otherLayouts, addSiteLayout]
  }
  
  // 如果没有找到保存的布局，生成默认布局（add-site 会自动排在最后）
  return generatePageLayout(pageItems)
}
