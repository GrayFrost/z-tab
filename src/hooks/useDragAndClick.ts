import { useRef } from 'react'

interface UseDragAndClickOptions {
  /**
   * 点击回调函数
   */
  onClick?: () => void
  /**
   * 外部拖拽状态 ref（可选，用于与 react-grid-layout 同步）
   */
  isDraggingRef?: React.MutableRefObject<boolean>
  /**
   * 是否禁用点击（例如：显示菜单时）
   */
  disabled?: boolean
  /**
   * 鼠标拖拽阈值（像素），默认 5
   */
  mouseDragThreshold?: number
  /**
   * 触控板拖拽阈值（像素），默认 10
   */
  touchDragThreshold?: number
  /**
   * 鼠标点击时间阈值（毫秒），默认 300
   */
  mouseTimeThreshold?: number
  /**
   * 触控板点击时间阈值（毫秒），默认 400
   */
  touchTimeThreshold?: number
}

/**
 * 拖拽和点击检测 Hook
 * 
 * 用于区分拖拽和点击操作，支持鼠标和触控板
 * 
 * @example
 * ```tsx
 * const { handleMouseDown } = useDragAndClick({
 *   onClick: () => window.open(url, '_blank'),
 *   isDraggingRef: externalDraggingRef,
 *   disabled: showMenu
 * })
 * 
 * return <div onMouseDown={handleMouseDown}>...</div>
 * ```
 */
export function useDragAndClick({
  onClick,
  isDraggingRef,
  disabled = false,
  mouseDragThreshold = 5,
  touchDragThreshold = 10,
  mouseTimeThreshold = 300,
  touchTimeThreshold = 400,
}: UseDragAndClickOptions = {}) {
  // 本地拖拽状态追踪（如果没有传入 ref）
  const localDraggingRef = useRef(false)
  const draggingRef = isDraggingRef || localDraggingRef

  // 点击检测
  const mouseDownPosRef = useRef<{
    x: number
    y: number
    time: number
    button: number
    isTouch: boolean
    dragThreshold: number
  } | null>(null)

  // 鼠标/触控板按下 - 记录位置和时间，并添加全局监听
  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果禁用或没有点击回调，不处理
    if (disabled || !onClick) {
      return
    }

    // 右键点击时不记录，让右键菜单正常显示
    // Mac 触控板的右键可能是 button === 2，也可能是 ctrl+click (button === 0 + ctrlKey)
    if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
      return
    }

    // 检测是否是触控板事件（通过 pointerType 或触摸事件）
    const isTouch =
      'pointerType' in e.nativeEvent
        ? (e.nativeEvent as PointerEvent).pointerType === 'touch' ||
          (e.nativeEvent as PointerEvent).pointerType === 'pen'
        : false

    // 根据设备类型选择阈值
    const dragThreshold = isTouch ? touchDragThreshold : mouseDragThreshold

    // 不阻止事件，让 react-grid-layout 可以处理拖拽
    mouseDownPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      button: e.button, // 0 = 左键/触控板点击, 1 = 中键, 2 = 右键
      isTouch,
      dragThreshold,
    }

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!mouseDownPosRef.current) return

      const clientX =
        'clientX' in moveEvent
          ? moveEvent.clientX
          : moveEvent.touches[0]?.clientX ?? 0
      const clientY =
        'clientY' in moveEvent
          ? moveEvent.clientY
          : moveEvent.touches[0]?.clientY ?? 0

      const deltaX = Math.abs(clientX - mouseDownPosRef.current!.x)
      const deltaY = Math.abs(clientY - mouseDownPosRef.current!.y)
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // 如果移动距离超过阈值，认为是拖拽
      if (distance > mouseDownPosRef.current.dragThreshold) {
        draggingRef.current = true
      }
    }

    const handleMouseUp = (upEvent: MouseEvent | TouchEvent) => {
      if (!mouseDownPosRef.current) {
        document.removeEventListener('mousemove', handleMouseMove as EventListener)
        document.removeEventListener('touchmove', handleMouseMove as EventListener)
        document.removeEventListener('mouseup', handleMouseUp as EventListener)
        document.removeEventListener('touchend', handleMouseUp as EventListener)
        return
      }

      // 只处理左键/触控板点击（button === 0）
      // 右键点击已经在 handleContextMenu 中处理了
      const isRightClick = 'button' in upEvent ? upEvent.button !== 0 : false

      if (isRightClick || mouseDownPosRef.current.button !== 0) {
        mouseDownPosRef.current = null
        document.removeEventListener('mousemove', handleMouseMove as EventListener)
        document.removeEventListener('touchmove', handleMouseMove as EventListener)
        document.removeEventListener('mouseup', handleMouseUp as EventListener)
        document.removeEventListener('touchend', handleMouseUp as EventListener)
        return
      }

      const wasTouch = mouseDownPosRef.current.isTouch
      const dragThreshold = mouseDownPosRef.current.dragThreshold
      const clientX =
        'clientX' in upEvent
          ? upEvent.clientX
          : upEvent.changedTouches[0]?.clientX ?? mouseDownPosRef.current.x
      const clientY =
        'clientY' in upEvent
          ? upEvent.clientY
          : upEvent.changedTouches[0]?.clientY ?? mouseDownPosRef.current.y
      const deltaX = Math.abs(clientX - mouseDownPosRef.current.x)
      const deltaY = Math.abs(clientY - mouseDownPosRef.current.y)
      const deltaTime = Date.now() - mouseDownPosRef.current.time
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const wasDragging = draggingRef.current

      mouseDownPosRef.current = null

      // 移除监听
      document.removeEventListener('mousemove', handleMouseMove as EventListener)
      document.removeEventListener('touchmove', handleMouseMove as EventListener)
      document.removeEventListener('mouseup', handleMouseUp as EventListener)
      document.removeEventListener('touchend', handleMouseUp as EventListener)

      // 根据设备类型选择时间阈值
      const timeThreshold = wasTouch ? touchTimeThreshold : mouseTimeThreshold

      // 判断是否是点击：移动距离小且时间短
      const isClick = distance < dragThreshold && deltaTime < timeThreshold

      // 如果移动距离小于阈值且时间小于阈值，认为是点击
      // 注意：即使 react-grid-layout 触发了拖拽，只要移动距离很小，我们也认为是点击
      if (isClick) {
        // 保存距离值，因为 mouseDownPosRef 会被清空
        const savedDistance = distance

        // 延迟执行，确保拖拽事件已经处理完毕
        setTimeout(() => {
          // 如果移动距离很小（< 阈值），就认为是点击，执行回调
          // 不依赖 draggingRef，因为 react-grid-layout 可能在很小移动时就设置它为 true
          if (savedDistance < dragThreshold) {
            onClick?.()
          }
        }, 200)
      }

      // 延迟重置拖拽状态
      setTimeout(() => {
        draggingRef.current = false
      }, 300)
    }

    // 同时监听鼠标和触摸事件，以支持触控板
    document.addEventListener('mousemove', handleMouseMove as EventListener)
    document.addEventListener('touchmove', handleMouseMove as EventListener, {
      passive: true,
    })
    document.addEventListener('mouseup', handleMouseUp as EventListener)
    document.addEventListener('touchend', handleMouseUp as EventListener, {
      passive: true,
    })
  }

  return {
    handleMouseDown,
    isDraggingRef: draggingRef,
  }
}

