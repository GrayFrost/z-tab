import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { SiteItem } from '@/components/WidgetGrid/types'

const DB_NAME = 'z-tab-db'
const DB_VERSION = 1

interface ZTabDB extends DBSchema {
  sites: {
    key: string
    value: SiteItem
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
  },
}
