import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// 构建后复制必要文件到 dist 目录
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')

      // 复制 manifest.json
      copyFileSync(path.resolve(__dirname, 'manifest.json'), path.resolve(distDir, 'manifest.json'))

      // 复制图标
      const iconsDir = path.resolve(distDir, 'icons')
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true })
      }

      // 如果存在 icon.svg，也复制过去
      if (existsSync(path.resolve(__dirname, 'icon.svg'))) {
        copyFileSync(path.resolve(__dirname, 'icon.svg'), path.resolve(distDir, 'icon.svg'))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab: path.resolve(__dirname, 'newtab.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
