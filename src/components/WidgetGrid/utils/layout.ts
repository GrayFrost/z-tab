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
 * 正确处理跨行组件的高度计算
 */
export function generatePageLayout(items: GridItem[]): Layout[] {
  const layouts: Layout[] = []
  // 记录每一行的占用情况：rowOccupied[y] 表示第y行从x=0到x=GRID_COLS-1的占用情况
  const rowOccupied: boolean[][] = []
  
  // 初始化行占用数组
  const initRow = (y: number) => {
    if (!rowOccupied[y]) {
      rowOccupied[y] = new Array(GRID_COLS).fill(false)
    }
  }
  
  // 检查指定位置是否可以放置组件
  const canPlace = (x: number, y: number, w: number, h: number): boolean => {
    // 检查是否超出边界
    if (x + w > GRID_COLS || y + h > PAGE_ROWS) {
      return false
    }
    
    // 检查所有需要占用的单元格是否都空闲
    for (let dy = 0; dy < h; dy++) {
      const currentY = y + dy
      initRow(currentY)
      for (let dx = 0; dx < w; dx++) {
        if (rowOccupied[currentY][x + dx]) {
          return false
        }
      }
    }
    return true
  }
  
  // 标记指定位置为已占用
  const markOccupied = (x: number, y: number, w: number, h: number) => {
    for (let dy = 0; dy < h; dy++) {
      const currentY = y + dy
      initRow(currentY)
      for (let dx = 0; dx < w; dx++) {
        rowOccupied[currentY][x + dx] = true
      }
    }
  }
  
  // 找到下一个可以放置的位置
  const findNextPosition = (w: number, h: number): { x: number; y: number } | null => {
    // 从第一行开始查找
    for (let y = 0; y <= PAGE_ROWS - h; y++) {
      for (let x = 0; x <= GRID_COLS - w; x++) {
        if (canPlace(x, y, w, h)) {
          return { x, y }
        }
      }
    }
    // 如果找不到位置，返回null表示无法放置
    return null
  }

  for (const item of items) {
    const { w, h } = sizeToGrid[item.size]

    // 禁用缩放
    const banResize = ['1x1', '2x1', '2x2', '4x2'].includes(item.size)
    // add-site 按钮固定位置，不可拖动
    const isStatic = item.type === 'add-site'

    // 找到下一个可以放置的位置
    const position = findNextPosition(w, h)

    // 如果找不到位置，返回一个特殊的布局表示无法放置
    if (!position) {
      // 返回一个超出范围的布局，调用方可以检测到这个情况
      const layout: Layout = {
        i: item.id,
        x: -1, // 无效的x坐标
        y: -1, // 无效的y坐标
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
      layouts.push(layout)
      continue
    }

    const { x, y } = position

    // 标记为已占用
    markOccupied(x, y, w, h)

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

    layouts.push(layout)
  }

  return layouts
}

/**
 * 将 items 分成多页
 * 使用实际的布局算法来检查组件是否能放在当前页
 * 确保每页最多只有4行（PAGE_ROWS）
 */
export function paginateItems(items: GridItem[]): GridItem[][] {
  const pages: GridItem[][] = []
  let currentPage: GridItem[] = []
  
  // 分离出 add-site 按钮
  const addSiteItem = items.find((item) => item.type === 'add-site')
  const otherItems = items.filter((item) => item.type !== 'add-site')

  // 检查组件是否能放在当前页（使用实际的布局算法）
  const canFitInPage = (pageItems: GridItem[], newItem: GridItem): boolean => {
    // 如果当前页为空，检查新组件的高度是否超过PAGE_ROWS
    if (pageItems.length === 0) {
      const { h } = sizeToGrid[newItem.size]
      return h <= PAGE_ROWS
    }

    // 尝试生成包含新组件的布局
    const testItems = [...pageItems, newItem]
    const testLayout = generatePageLayout(testItems)

    // 检查是否有任何组件无法放置（x=-1, y=-1表示无法放置）
    const hasInvalidPlacement = testLayout.some(layout => layout.x === -1 && layout.y === -1)
    if (hasInvalidPlacement) {
      return false
    }

    // 检查所有组件的最大行数是否超过PAGE_ROWS
    // 找到最大的 y + h 值
    let maxRow = 0
    for (const layout of testLayout) {
      const bottomRow = layout.y + layout.h
      if (bottomRow > maxRow) {
        maxRow = bottomRow
      }
    }

    // 如果最大行数超过PAGE_ROWS，说明放不下
    return maxRow <= PAGE_ROWS
  }

  for (const item of otherItems) {
    // 尝试将当前组件添加到当前页
    if (canFitInPage(currentPage, item)) {
      currentPage.push(item)
    } else {
      // 如果当前页放不下，开始新的一页
      if (currentPage.length > 0) {
        pages.push(currentPage)
      }
      currentPage = [item]
    }
  }

  // 处理最后一页和 add-site 按钮
  if (addSiteItem) {
    if (canFitInPage(currentPage, addSiteItem)) {
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
 * 根据保存的布局顺序对 items 进行排序，并按照布局中的页面分组
 * add-site 按钮总是排在最后一个widget后面
 */
export function sortItemsByLayout(items: GridItem[], savedLayout: Layout[]): GridItem[] {
  if (!savedLayout || savedLayout.length === 0) return items

  // 创建一个 id -> 布局 的映射
  const layoutMap = new Map<string, Layout>()
  savedLayout.forEach((l) => {
    layoutMap.set(l.i, l)
  })

  // 分离 add-site 按钮
  const addSiteItem = items.find((item) => item.type === 'add-site')
  const otherItems = items.filter((item) => item.type !== 'add-site')

  // 根据全局 y 坐标确定每个组件应该在哪一页
  // 每页最多4行，所以 y < 4 在第0页，y < 8 在第1页，以此类推
  const itemsByPage = new Map<number, GridItem[]>()
  
  otherItems.forEach((item) => {
    const layout = layoutMap.get(item.id)
    if (layout) {
      // 根据全局 y 坐标计算应该在哪一页
      const pageIndex = Math.floor(layout.y / PAGE_ROWS)
      if (!itemsByPage.has(pageIndex)) {
        itemsByPage.set(pageIndex, [])
      }
      itemsByPage.get(pageIndex)!.push(item)
    } else {
      // 如果没有保存的布局，放到第0页
      if (!itemsByPage.has(0)) {
        itemsByPage.set(0, [])
      }
      itemsByPage.get(0)!.push(item)
    }
  })

  // 对每页内的 items 进行排序（按 y * 1000 + x）
  itemsByPage.forEach((pageItems) => {
    pageItems.sort((a, b) => {
      const layoutA = layoutMap.get(a.id)
      const layoutB = layoutMap.get(b.id)
      if (!layoutA || !layoutB) return 0
      const posA = layoutA.y * 1000 + layoutA.x
      const posB = layoutB.y * 1000 + layoutB.x
      return posA - posB
    })
  })

  // 按照页面顺序合并 items
  const sortedItems: GridItem[] = []
  const sortedPageIndices = Array.from(itemsByPage.keys()).sort((a, b) => a - b)
  sortedPageIndices.forEach((pageIndex) => {
    sortedItems.push(...itemsByPage.get(pageIndex)!)
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

  // 计算当前页之前的所有页的最大全局 y 值（yOffset）
  // 对于第0页：yOffset = 0
  // 对于第1页：yOffset = 第0页的最大全局y值
  // 对于第2页：yOffset = 第1页的最大全局y值
  let yOffset = 0
  if (pageIndex > 0) {
    // 找到前一页的最大全局 y 值
    const prevPageItems = pages[pageIndex - 1]
    if (prevPageItems) {
      let maxY = 0
      prevPageItems.forEach((item) => {
        if (item.type !== 'add-site') {
          // 优先从 globalLayoutMap 中获取（可能已经更新）
          // 如果没有，从 savedGlobalLayout 中获取
          let layout = globalLayoutMap.get(item.id)
          if (!layout && savedGlobalLayout) {
            layout = savedGlobalLayout.find((l) => l.i === item.id)
          }
          if (layout) {
            // layout.y 已经是全局坐标，直接取最大值
            maxY = Math.max(maxY, layout.y + layout.h)
          }
        }
      })
      yOffset = maxY
    }
  }

  // 更新当前页的布局，将页面内的相对 y 坐标转换为全局坐标（不包括 add-site）
  const addSiteLayouts: Layout[] = []
  pageLayout.forEach((layout) => {
    const item = allItems.find((i) => i.id === layout.i)
    if (item && item.type !== 'add-site') {
      const { w, h } = sizeToGrid[item.size]
      const banResize = ['1x1', '2x1', '2x2', '4x2'].includes(item.size)

      // 将页面内的相对 y 坐标转换为全局坐标
      // pageLayout 中的 y 是页面内的相对坐标（0-3），需要加上 yOffset
      const globalY = layout.y + yOffset

      globalLayoutMap.set(layout.i, {
        ...layout,
        x: layout.x,
        y: globalY,
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
    } else if (item && item.type === 'add-site') {
      // 保存 add-site 的布局，稍后处理
      addSiteLayouts.push(layout)
    }
  })
  
  // 对于 add-site 按钮，总是计算它在最后一个组件之后的位置
  const addSiteItem = allItems.find((item) => item.type === 'add-site')
  if (addSiteItem) {
    // 找到所有非 add-site 的布局，计算最后一个组件的位置
    const otherLayouts: Layout[] = Array.from(globalLayoutMap.values()).filter((l) => {
      const item = allItems.find((i) => i.id === l.i)
      return item && item.type !== 'add-site'
    }) as Layout[]
    
    if (otherLayouts.length > 0) {
      // 找到最后一个组件的位置（最大的 y * 1000 + x）
      const lastLayout = otherLayouts.reduce<Layout | null>((prev, layout) => {
        if (!prev) return layout
        if (layout.y > prev.y || (layout.y === prev.y && layout.x > prev.x)) {
          return layout
        }
        return prev
      }, null)
      
      if (lastLayout) {
        // 计算 add-site 的位置：在最后一个组件之后
        // 注意：lastLayout 的 y 已经是全局坐标，需要转换为当前页的相对坐标来计算
        const relativeY = lastLayout.y - yOffset
        let addSiteX = lastLayout.x + lastLayout.w
        let addSiteY = relativeY
        
        // 如果右侧放不下，换到下一行
        if (addSiteX + 1 > GRID_COLS) {
          addSiteX = 0
          addSiteY = relativeY + lastLayout.h
        }
        
        // 确保 add-site 在当前页范围内
        if (addSiteY >= PAGE_ROWS) {
          addSiteY = Math.max(0, PAGE_ROWS - 1)
        }
        
        // 将相对坐标转换为全局坐标保存
        const globalAddSiteY = addSiteY + yOffset
        
        const { w, h } = sizeToGrid[addSiteItem.size]
        globalLayoutMap.set(addSiteItem.id, {
          i: addSiteItem.id,
          x: addSiteX,
          y: globalAddSiteY,
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
 * 需要将全局 y 坐标转换为页面内的相对坐标
 */
export function extractPageLayoutFromGlobal(
  pageItems: GridItem[],
  globalLayout: Layout[],
  _allItems: GridItem[],
  pages: GridItem[][],
  pageIndex: number
): Layout[] {
  // 分离 add-site 按钮和其他组件
  const addSiteItem = pageItems.find((item) => item.type === 'add-site')
  const otherItems = pageItems.filter((item) => item.type !== 'add-site')
  
  // 计算当前页之前所有页的最大全局 y 值（yOffset）
  // 对于第0页：yOffset = 0
  // 对于第1页：yOffset = 第0页的最大全局y值
  // 对于第2页：yOffset = 第1页的最大全局y值（因为第1页的y已经是全局坐标）
  let yOffset = 0
  if (pageIndex > 0) {
    // 找到前一页的最大全局 y 值
    const prevPageItems = pages[pageIndex - 1]
    if (prevPageItems) {
      let maxY = 0
      prevPageItems.forEach((item) => {
        if (item.type !== 'add-site') {
          const savedLayout = globalLayout.find((l) => l.i === item.id)
          if (savedLayout) {
            // savedLayout.y 已经是全局坐标，直接取最大值
            maxY = Math.max(maxY, savedLayout.y + savedLayout.h)
          }
        }
      })
      yOffset = maxY
    }
  }
  
  // 获取其他组件的布局（使用保存的位置，并转换为页面内相对坐标）
  const otherLayouts: Layout[] = []
  otherItems.forEach((item) => {
    const savedLayout = globalLayout.find((l) => l.i === item.id)
    if (savedLayout) {
      const { w, h } = sizeToGrid[item.size]
      const banResize = ['1x1', '2x1', '2x2', '4x2'].includes(item.size)
      
      // 将全局 y 坐标转换为页面内相对坐标
      const relativeY = Math.max(0, savedLayout.y - yOffset)
      
      // 验证坐标是否在页面范围内
      if (relativeY + h <= PAGE_ROWS && savedLayout.x + w <= GRID_COLS) {
        otherLayouts.push({
          ...savedLayout,
          x: savedLayout.x,
          y: relativeY,
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
    }
  })
  
  // 如果其他组件都有保存的布局且坐标有效，计算 add-site 的位置
  // 如果有些组件没有保存的布局或坐标无效，则重新生成布局
  if (otherLayouts.length === otherItems.length && addSiteItem) {
    // 找到最后一个组件的位置（最大的 y，如果 y 相同则最大的 x）
    const lastLayout = otherLayouts.reduce<Layout | null>((prev, layout) => {
      if (!prev) return layout
      if (layout.y > prev.y || (layout.y === prev.y && layout.x > prev.x)) {
        return layout
      }
      return prev
    }, null)
    
    // 计算 add-site 的位置：在最后一个组件之后
    let addSiteX = 0
    let addSiteY = lastLayout?.y ?? 0
    
    if (lastLayout) {
      // add-site 放在最后一个组件的右侧
      addSiteX = lastLayout.x + lastLayout.w
      // 如果右侧放不下，换到下一行
      if (addSiteX + 1 > GRID_COLS) {
        addSiteX = 0
        addSiteY = lastLayout.y + lastLayout.h
      }
      
      // 确保 add-site 不会超出页面范围
      if (addSiteY >= PAGE_ROWS) {
        addSiteY = Math.max(0, PAGE_ROWS - 1)
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
