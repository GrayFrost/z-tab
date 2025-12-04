import type { SiteItem } from '../types'

const STORAGE_KEY = 'z-tab-sites'

// 保存网站列表到 localStorage
export function saveSites(sites: SiteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites))
  } catch (error) {
    console.error('Failed to save sites to localStorage:', error)
  }
}

// 从 localStorage 读取网站列表
export function loadSites(): SiteItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data) as SiteItem[]
    }
  } catch (error) {
    console.error('Failed to load sites from localStorage:', error)
  }
  return []
}

