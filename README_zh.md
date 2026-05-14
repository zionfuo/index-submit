# Astro SEO Index Submitter

在 Astro 构建完成后自动将 sitemap.xml 中的 URL 提交到 Google Indexing API 和 Bing IndexNow，加速搜索引擎收录。

## 功能

- 自动读取 sitemap.xml 并提交所有 URL
- 同时提交到 Google Indexing API 和 Bing IndexNow
- 自动生成 IndexNow API key 文件到 `public/` 目录
- 按 robots.txt 过滤禁止抓取的页面
- 支持 Dry Run 模式（测试不实际提交）
- 作为 Astro Integration 安装，符合官方 API 规范

## 安装

```bash
npm install
```

## 配置

在 `astro.config.mjs` 中注册插件：

```javascript
import { defineConfig } from 'astro/config';
import { createSeoSubmitterIntegration } from './src/integrations/seo-submitter';

export default defineConfig({
  integrations: [
    createSeoSubmitterIntegration(),
  ],
});
```

## 环境变量

在 Cloudflare Pages（或你使用的 CI/CD）环境变量中添加：

| 变量 | 必填 | 说明 |
|------|------|------|
| `GOOGLE_CREDENTIALS_JSON` | 是 | Google 服务账号 JSON 字符串（完整 JSON，不是文件路径） |
| `INDEXNOW_API_KEY` | 是 | Bing IndexNow API key |
| `INDEXNOW_HOST` | 是 | 网站域名，如 `example.com` |
| `SITEMAP_URL` | 否 | sitemap 地址，默认 `{origin}/sitemap.xml` |
| `DRY_RUN` | 否 | `true` 时只打日志不实际提交（用于测试） |

### Google 服务账号配置

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 创建项目
2. 启用 **Indexing API** (`indexing.googleapis.com`)
3. 创建服务账号，下载 JSON 密钥文件
4. 将 JSON 文件内容完整复制到 `GOOGLE_CREDENTIALS_JSON` 环境变量

### Bing IndexNow 配置

1. 在 [Bing Webmaster Tools](https://www.bing.com/webmasters) 添加你的网站
2. 获取 IndexNow API key（或使用 Bing 提供的 key）
3. 设置 `INDEXNOW_API_KEY` 和 `INDEXNOW_HOST`

## 目录结构

```
src/
  lib/
    sitemap-parser.ts      # 解析 sitemap XML
    robots-filter.ts       # 按 robots.txt 过滤 URL
    google-indexer.ts      # Google Indexing API 客户端
    indexnow-indexer.ts    # Bing IndexNow 客户端
    key-file-generator.ts  # 生成 IndexNow key 文件
    seo-submitter.ts       # 整合所有模块
  integrations/
    seo-submitter.ts       # Astro Integration 插件
astro.config.mjs           # 注册插件
```

## 工作流程

1. `astro build` 完成
2. 读取 sitemap.xml 获取所有 URL
3. 按 robots.txt 过滤
4. 生成 `{INDEXNOW_API_KEY}.txt` 到 `public/` 目录
5. 并行提交到 Google 和 Bing
6. 输出提交结果日志

## 构建日志示例

```
[SEO Submitter] Starting submission...
[SEO Submitter] Sitemap: https://example.com/sitemap.xml
[SEO Submitter] Found 42 URLs in sitemap
[SEO Submitter] Generated IndexNow key file: /dist/your-key.txt
[SEO Submitter] Google: 42 submitted, 0 failed
[SEO Submitter] Bing IndexNow: 42 submitted, 0 failed
[SEO Submitter] Submission complete
```