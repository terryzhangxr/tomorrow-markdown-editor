# tomorrow-markdown-editor

一个由Terryzhang编写的美观、功能丰富的实时 Markdown 编辑器，支持一键部署到 Vercel。
![图片描述](https://ik.imagekit.io/terryzhang/IMG_7115.jpeg)
![图片描述](https://ik.imagekit.io/terryzhang/IMG_7116.jpeg)
![图片描述](https://ik.imagekit.io/terryzhang/IMG_7118.jpeg)
![图片描述](https://ik.imagekit.io/terryzhang/IMG_7114.jpeg)

## 功能特点

- ✨ **实时预览** - 左侧编辑，右侧即时渲染
- 🎨 **主题切换** - 支持亮色/暗色模式
- 💾 **本地存储** - 内容自动保存到浏览器
- 📝 **语法高亮** - 代码块自动高亮
- 📋 **一键复制** - 快速复制 Markdown 或代码
- 📥 **文件下载** - 导出为 .md 文件
- 🚀 **快速工具栏** - 点击插入常用语法
- 📱 **响应式设计** - 适配各种屏幕尺寸

## 快速部署

### 部署到 Vercel（推荐）

### 1 直接部署 点击下方button直达
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/terryzhangxr/tomorrow-markdown-editor)
### 2 若需编辑代码，先fork后depoly
1. Fork 此仓库或创建新仓库
2. 复制所有文件到你的仓库
3. 登录 [Vercel](https://vercel.com)
4. 点击 "New Project" → "Import Git Repository"
5. 选择你的仓库，点击 "Deploy"
6. 等待部署完成，即可访问你的编辑器

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/markdown-editor.git

# 进入目录
cd markdown-editor

# 使用本地服务器运行
# 方法1：使用 Python
python3 -m http.server 8000

