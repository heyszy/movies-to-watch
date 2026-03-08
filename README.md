# Movies To Watch

基于 TMDB API 构建的电影前端应用，支持热门电影浏览、关键词搜索、电影详情查看和本地待看清单管理。

## 主要功能

- 首页展示 TMDB 趋势电影列表，支持无限滚动加载，使用**虚拟列表**渲染
- 关键词搜索电影，并支持结果排序
- 电影详情页展示概览、演职员、预告片、评论
- 待看清单支持本地持久化（`localStorage`）
- 待看清单支持排序、Lottery、清空

## 技术栈

- Next.js 16（App Router）
- React 19
- TypeScript
- Tailwind CSS 4
- Base UI
- TanStack Query
- Zustand
- Vitest
- Biome
- TanStack Virtual

## 环境变量

复制 `.env.example` 为 `.env.local`，并至少配置以下变量：

```bash
TMDB_API_KEY=YOUR_TMDB_BEARER_TOKEN
```

可选变量：

- `TMDB_BASE_URL`：TMDB API 基础地址（默认 `https://api.themoviedb.org/3`）
- `TMDB_IMAGE_BASE_URL`：TMDB 图片基础地址（默认 `https://image.tmdb.org/t/p`）
- `NEXT_PUBLIC_API_URL`：服务端请求内部 API 的站点地址

## 快速开始

```bash
pnpm install
pnpm dev
```

本地访问：`http://localhost:3000`

## 可用命令

```bash
pnpm dev         # 启动开发环境
pnpm build       # 构建生产版本
pnpm start       # 启动生产服务
pnpm lint        # 代码检查（Biome）
pnpm format      # 代码格式化（Biome）
pnpm typecheck   # TypeScript 类型检查
pnpm test        # 运行单次测试（Vitest）
pnpm test:watch  # 监听模式测试
pnpm check       # lint + typecheck + test
```

## 项目结构

```text
app/                # 路由与 API
features/           # 按业务拆分的功能模块
shared/             # 跨模块共享逻辑与组件
```
