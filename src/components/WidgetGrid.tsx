export function WidgetGrid() {
  return (
    <div className="w-full max-w-5xl mt-16 px-4">
      <div className="grid grid-cols-4 gap-4">
        {/* 占位小组件 */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground text-sm"
          >
            Widget {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

