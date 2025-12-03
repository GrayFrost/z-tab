# Z-Tab Chrome Extension

一个简单的 Chrome 扩展，显示 Hello World。

## 项目结构

```
z-tab/
├── manifest.json    # 扩展配置文件
├── popup.html       # 弹出页面
├── popup.css        # 样式文件
├── popup.js         # JavaScript 文件
├── package.json     # Node.js 配置
├── icons/           # 图标目录
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 安装步骤

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `z-tab` 项目目录

## 图标生成

如果没有图标文件，可以使用在线工具生成或使用以下命令（需要安装 ImageMagick）：

```bash
# 从 SVG 生成不同尺寸的 PNG 图标
convert -background none icon.svg -resize 16x16 icons/icon16.png
convert -background none icon.svg -resize 48x48 icons/icon48.png
convert -background none icon.svg -resize 128x128 icons/icon128.png
```

或者暂时可以先删除 manifest.json 中的 icons 配置来测试。

## 开发

- Node.js 版本: >= 22.13.0

