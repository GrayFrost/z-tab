// 获取 favicon 服务列表
function getFaviconServices(url: string): string[] {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    return [
      // 1. 直接访问网站的 favicon（最可靠）
      `${urlObj.origin}/favicon.ico`,
      // 2. DuckDuckGo favicon 服务（国内可访问）
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      // 3. Favicon.im 服务
      `https://favicon.im/${domain}`,
      // 4. Google 服务（备用，国内可能无法访问）
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    ]
  } catch {
    return []
  }
}

// 获取网站 favicon - 多个备选源
export function getFaviconUrl(url: string, fallbackIndex = 0): string {
  const services = getFaviconServices(url)
  return services[fallbackIndex] || services[0] || ''
}

// 获取下一个 favicon URL
export function getNextFaviconUrl(url: string, currentFavicon: string): string | null {
  const services = getFaviconServices(url)
  const currentIndex = services.indexOf(currentFavicon)
  
  if (currentIndex >= 0 && currentIndex < services.length - 1) {
    return services[currentIndex + 1]
  }
  return null
}

// 从 URL 提取网站名称
export function getSiteName(url: string): string {
  try {
    const urlObj = new URL(url)
    // 移除 www. 前缀并取主域名
    return urlObj.hostname.replace(/^www\./, '').split('.')[0]
  } catch {
    return '网站'
  }
}

