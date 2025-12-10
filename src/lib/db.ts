import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { SiteItem, WidgetItem } from '@/components/WidgetGrid/types'

const DB_NAME = 'z-tab-db'
const DB_VERSION = 1

// WidgetItem 存储类型（不包含 icon，因为 icon 是函数无法序列化）
type StoredWidgetItem = Omit<WidgetItem, 'icon'>

interface ZTabDB extends DBSchema {
  sites: {
    key: string
    value: SiteItem
  }
  widgets: {
    key: string
    value: StoredWidgetItem
  }
  settings: {
    key: string
    value: any
  }
}

let dbPromise: Promise<IDBPDatabase<ZTabDB>>

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ZTabDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 创建站点存储
        if (!db.objectStoreNames.contains('sites')) {
          db.createObjectStore('sites', { keyPath: 'id' })
        }
        // 创建组件存储
        if (!db.objectStoreNames.contains('widgets')) {
          db.createObjectStore('widgets', { keyPath: 'id' })
        }
        // 创建设置存储
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings')
        }
      },
    })
  }
  return dbPromise
}

export const db = {
  // 站点相关操作
  sites: {
    async getAll(): Promise<SiteItem[]> {
      const db = await getDB()
      return db.getAll('sites')
    },

    async add(site: SiteItem) {
      const db = await getDB()
      return db.put('sites', site)
    },

    async update(site: SiteItem) {
      const db = await getDB()
      return db.put('sites', site)
    },

    async delete(id: string) {
      const db = await getDB()
      return db.delete('sites', id)
    },

    async saveAll(sites: SiteItem[]) {
      const db = await getDB()
      const tx = db.transaction('sites', 'readwrite')
      const store = tx.objectStore('sites')

      // 清空旧数据
      await store.clear()

      // 批量添加新数据
      await Promise.all(sites.map((site) => store.add(site)))
      await tx.done
    },
  },

  // 组件相关操作
  widgets: {
    async getAll(): Promise<StoredWidgetItem[]> {
      const db = await getDB()
      return db.getAll('widgets')
    },

    async add(widget: StoredWidgetItem) {
      const db = await getDB()
      return db.put('widgets', widget)
    },

    async update(widget: StoredWidgetItem) {
      const db = await getDB()
      return db.put('widgets', widget)
    },

    async delete(id: string) {
      const db = await getDB()
      return db.delete('widgets', id)
    },

    async saveAll(widgets: StoredWidgetItem[]) {
      const db = await getDB()
      const tx = db.transaction('widgets', 'readwrite')
      const store = tx.objectStore('widgets')

      // 清空旧数据
      await store.clear()

      // 批量添加新数据
      await Promise.all(widgets.map((widget) => store.add(widget)))
      await tx.done
    },
  },

  // 设置相关操作
  settings: {
    async get(key: string) {
      const db = await getDB()
      return db.get('settings', key)
    },

    async set(key: string, value: any) {
      const db = await getDB()
      return db.put('settings', value, key)
    },

    async clear() {
      const db = await getDB()
      return db.clear('settings')
    },
  },

  // 重置整个数据库（清空所有数据）
  async resetAll() {
    const db = await getDB()
    const objectStoreNames = Array.from(db.objectStoreNames)
    const storesToClear = ['sites', 'widgets', 'settings'].filter((name) =>
      objectStoreNames.includes(name)
    )
    
    if (storesToClear.length === 0) {
      return
    }
    
    const tx = db.transaction(storesToClear, 'readwrite')
    await Promise.all(storesToClear.map((name) => tx.objectStore(name).clear()))
    await tx.done
  },
}
