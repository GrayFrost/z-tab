import { useState } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

type WidgetSize = '1x1' | '2x1' | '2x2' | '4x2'

interface WidgetItem {
  id: string
  size: WidgetSize
  title: string
  icon: string
}

const sizeToGrid: Record<WidgetSize, { w: number; h: number }> = {
  '1x1': { w: 1, h: 1 },
  '2x1': { w: 2, h: 1 },
  '2x2': { w: 2, h: 2 },
  '4x2': { w: 4, h: 2 },
}

// 示例组件数据
const defaultWidgets: WidgetItem[] = [
  { id: 'banner', size: '4x2', title: '大型横幅组件', icon: '📊' },
  { id: 'medium', size: '2x2', title: '中等组件', icon: '📈' },
  { id: 'wide', size: '2x1', title: '横向组件', icon: '⏰' },
  { id: 'small1', size: '1x1', title: '天气', icon: '🌤️' },
  { id: 'small2', size: '1x1', title: '笔记', icon: '📝' },
  { id: 'small3', size: '1x1', title: '目标', icon: '🎯' },
  { id: 'small4', size: '1x1', title: '设置', icon: '⚙️' },
]

// Grid 配置常量
const GRID_COLS = 8
const GRID_MARGIN = 32
// 1x1 基础单元格尺寸为 80px 正方形
const CELL_SIZE = 80
// 计算总宽度: 单元格尺寸 * 列数 + 间隙 * (列数 - 1)
const GRID_WIDTH = CELL_SIZE * GRID_COLS + GRID_MARGIN * (GRID_COLS - 1)
const ROW_HEIGHT = CELL_SIZE

// 生成初始布局
function generateLayout(widgets: WidgetItem[]): Layout[] {
  let x = 0
  let y = 0

  return widgets.map((widget) => {
    const { w, h } = sizeToGrid[widget.size]

    // 如果当前行放不下，换到下一行
    if (x + w > GRID_COLS) {
      x = 0
      y += 1
    }

    const layout: Layout = {
      i: widget.id,
      x,
      y,
      w,
      h,
      minW: 1,
      minH: 1,
      maxW: GRID_COLS,
      maxH: 4,
    }

    x += w
    if (x >= GRID_COLS) {
      x = 0
      y += h
    }

    return layout
  })
}

interface WidgetCardProps {
  widget: WidgetItem
}

function WidgetCard({ widget }: WidgetCardProps) {
  const sizeLabel = widget.size.replace('x', '×')

  return (
    <div className="h-full rounded-2xl bg-card border border-border p-4 flex flex-col cursor-move">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-foreground truncate">{widget.title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0 ml-2">
          {sizeLabel}
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <span className="text-3xl">{widget.icon}</span>
      </div>
    </div>
  )
}

export function WidgetGrid() {
  const [widgets] = useState<WidgetItem[]>(defaultWidgets)
  const [layout, setLayout] = useState<Layout[]>(() => generateLayout(defaultWidgets))

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout)
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
          draggableHandle=".cursor-move"
          isResizable={true}
          isDraggable={true}
          useCSSTransforms={true}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetCard widget={widget} />
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  )
}
