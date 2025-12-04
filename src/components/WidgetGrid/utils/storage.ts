import type { SiteItem } from '../types'

const STORAGE_KEY = 'z-tab-sites'
const FAVICON_CACHE_KEY = 'z-tab-favicon-cache'

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

// Favicon 缓存相关
type FaviconCache = Record<string, string> // domain -> base64

function getFaviconCache(): FaviconCache {
  try {
    const data = localStorage.getItem(FAVICON_CACHE_KEY)
    if (data) {
      return JSON.parse(data) as FaviconCache
    }
  } catch (error) {
    console.error('Failed to load favicon cache:', error)
  }
  return {}
}

function saveFaviconCache(cache: FaviconCache): void {
  try {
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Failed to save favicon cache:', error)
  }
}

// 获取域名作为缓存 key
function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

// 保存 favicon 到缓存
export function cacheFavicon(siteUrl: string, base64: string): void {
  const domain = getDomain(siteUrl)
  const cache = getFaviconCache()
  cache[domain] = base64
  saveFaviconCache(cache)
}

// 从缓存获取 favicon
export function getCachedFavicon(siteUrl: string): string | null {
  const domain = getDomain(siteUrl)
  const cache = getFaviconCache()
  return cache[domain] || null
}

// 通过 Canvas 将图片转换为 base64（避免 CORS 问题）
export function imageToBase64(img: HTMLImageElement): string | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || 64
    canvas.height = img.naturalHeight || 64
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    ctx.drawImage(img, 0, 0)
    return canvas.toDataURL('image/png')
  } catch {
    // 如果图片是跨域的且没有 CORS 头，toDataURL 会失败
    return null
  }
}

