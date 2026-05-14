# Astro SEO Index Submitter — 自动提交搜索引擎索引

**日期**: 2026-05-14
**状态**: 已批准

---

## 概述

在 Astro 构建完成后 (`astro:build:done` hook)，自动将 sitemap.xml 中的所有 URL 提交到 Google Indexing API 和 Bing IndexNow，实现"构建即提交"的自动化 SEO 索引加速。

---

## 功能

1. **读取 sitemap** — 从 `SITEMAP_URL` 环境变量指定的地址拉取并解析 XML，获取所有页面 URL
2. **去重 + 过滤** — 过滤掉 `robots.txt` 中禁止抓取的路径；同一 URL 24 小时内不重复提交
3. **Google Indexing API 提交** — 使用服务账号 JWT 认证，提交每个 URL 的 `URL_UPDATED` 通知
4. **Bing IndexNow 提交** — 主动 POST 到 `https://api.indexnow.org/IndexNow`，提交 URL 列表
5. **生成 key 文件** — 在 `public/` 目录下生成 `{INDEXNOW_API_KEY}.txt` 文件，用于 Bing 验证域名所有权
6. **构建日志** — 输出提交统计（成功/失败数量），便于 CI/CD 排查

---

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `GOOGLE_CREDENTIALS_JSON` | 是 | Google 服务账号 JSON 字符串（完整 JSON，不是文件路径） |
| `INDEXNOW_API_KEY` | 是 | Bing IndexNow API key |
| `INDEXNOW_HOST` | 是 | 网站域名，如 `example.com` |
| `SITEMAP_URL` | 否 | sitemap 地址，默认 `{origin}/sitemap.xml` |
| `DRY_RUN` | 否 | `true` 时只打日志不实际提交（用于测试） |

---

## 技术方案

### 依赖

- `googleapis` — Google OAuth2 JWT 认证 + Indexing API 调用
- `node-fetch` 或内置 `fetch` — 发送 IndexNow POST 请求（Node 18+内置）
- `fast-xml-parser` — 解析 sitemap XML

### Google 认证流程

1. 将 `GOOGLE_CREDENTIALS_JSON` JSON 字符串写入临时文件
2. 使用 `google.auth.JWT` 从临时文件加载服务账号凭证
3. 请求 `https://www.googleapis.com/oauth2/v4/token` 获取 access token
4. 用 access token 调用 `https://indexing.googleapis.com/v3/urlNotifications:publish`

### Bing IndexNow 流程

1. 构建时在 `public/` 目录生成 `{INDEXNOW_API_KEY}.txt` 文件，内容为 API key
2. POST 到 `https://api.indexnow.org/IndexNow`，JSON body：
   ```json
   {
     "host": "example.com",
     "key": "your-api-key",
     "keyLocation": "https://example.com/your-api-key.txt",
     "urlList": ["https://example.com/page1", "https://example.com/page2"]
   }
   ```

### 目录结构

```
src/
  lib/
    seo-submitter.ts       # 核心逻辑（Google + IndexNow）
    google-indexer.ts      # Google Indexing API 客户端
    indexnow-indexer.ts    # Bing IndexNow 客户端
    sitemap-parser.ts      # Sitemap XML 解析
astro.config.mjs           # 集成 astro:build:done hook
```

### 触发时机

使用 Astro 的 `astro:build:done` hook，在 `astro build` 完成后执行提交逻辑。

---

## 错误处理

- **Google 某 URL 失败**：记录错误，继续提交其他 URL
- **Bing 某 URL 失败**：记录错误，继续提交其他 URL
- **整个 Google 失败**：不影响 Bing 提交（两者独立）
- **网络重试**：每个 API 调用最多重试 3 次，指数退避

---

## 部署流程（Cloudflare Pages）

1. 在 Cloudflare Pages 环境变量中添加上述环境变量
2. `GOOGLE_CREDENTIALS_JSON` 需要是展开后的完整 JSON 字符串（注意换行和引号转义）
3. 构建时自动触发提交，构建日志中可见提交结果

---

## 待办

- [ ] 写实现计划
- [ ] 实现 `seo-submitter.ts`
- [ ] 集成到 `astro.config.mjs`
- [ ] 测试