import type { WidgetSize } from './types'

// Grid 配置常量
export const GRID_COLS = 8
export const GRID_MARGIN = 32
// 1x1 基础单元格尺寸为 80px 正方形
export const CELL_SIZE = 80
// 计算总宽度: 单元格尺寸 * 列数 + 间隙 * (列数 - 1)
export const GRID_WIDTH = CELL_SIZE * GRID_COLS + GRID_MARGIN * (GRID_COLS - 1)
export const ROW_HEIGHT = CELL_SIZE

// 尺寸映射
export const sizeToGrid: Record<WidgetSize, { w: number; h: number }> = {
  '1x1': { w: 1, h: 1 },
  '2x1': { w: 2, h: 1 },
  '2x2': { w: 2, h: 2 },
  '4x2': { w: 4, h: 2 },
}

