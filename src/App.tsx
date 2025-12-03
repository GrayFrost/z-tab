import { SearchBar } from '@/components/SearchBar'
import { WidgetGrid } from '@/components/WidgetGrid'

function App() {
  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <div className="flex flex-col items-center pt-24 px-4">
        <SearchBar />
        <WidgetGrid />
      </div>
    </div>
  )
}

export default App
