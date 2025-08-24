# workers-mcp

一个基于 Cloudflare Pages Functions + Hono 的轻量化远程工具服务（MCP 风格）。特性：
- Pages Functions 无状态运行，静态首页 + API 一体化，零外部依赖
- 工具系统标准接口 + 动态发现（构建期生成 manifest，运行期只读注册）
- API Token 鉴权中间件（Authorization: Bearer 或 x-api-key，来源环境变量 API_TOKENS）
- 去 OAuth / 去 R2，存储抽象预留 Supabase/Vercel KV/Deno KV（默认内存占位）
- MCP 对齐：提供 /mcp/tools（清单），/mcp/invoke 最小兼容已实现

注意：本仓库默认名称已统一为 workers-mcp（package.json、wrangler.jsonc、README）。

## 快速开始（本地）

前置要求
- Node.js ≥ 18
- Wrangler ≥ 4（登录：wrangler login）

安装与开发
```bash
# 安装依赖
npm i

# 生成工具清单（也会在 dev/deploy/start 前自动生成）
npm run gen:tools

# 以 Cloudflare Pages 模式本地开发（推荐）
wrangler pages dev .
```

打开终端打印的本地地址（通常 http://127.0.0.1:8788/）：
- 首页：工具清单与示例抽屉（纯 HTML/CSS/JS）
- 健康检查：/health
- 工具清单：/tools（公开）
- MCP 工具清单：/mcp/tools（公开）
- 调用工具：/invoke（需要 Token）
- MCP 调用：/mcp/invoke（需要 Token）

如果你继续使用 `npm run dev`（wrangler dev），将以 Workers 方式启动，不会加载 Pages 静态页与 functions 路由。建议切换 `wrangler pages dev .` 进行 Pages 化开发。

## 环境变量

在 Cloudflare Pages/本地设置以下变量：
- API_TOKENS：逗号分隔的 Token 列表，例如 token1,token2（用于 /invoke 与 /mcp/invoke 鉴权）
- SUPABASE_URL（可选，预留）
- SUPABASE_SERVICE_ROLE_KEY（可选，预留）
- SEARXNG_URL（可选，默认见 src/utils/env-config.ts）

本地可用 .dev.vars 或系统环境变量注入。未配置 API_TOKENS 时，受保护接口返回 401 config_missing。

## 接口文档

通用错误结构
```json
{ "error": { "code": "string", "message": "string", "details": {} } }
```

错误码约定
- config_missing：未配置必要环境变量（如 API_TOKENS）
- unauthorized：缺少或无效的 Token
- invalid_json：请求体不是有效 JSON
- invalid_argument：必要字段缺失或类型不合法
- tool_not_found：请求的工具不存在

路由一览
- GET /health
  - 返回示例：
    ```json
    { "ok": true, "name": "workers-mcp", "runtime": "cloudflare-pages", "time": "ISO", "tools": 4 }
    ```
- GET /tools
  - 返回工具数组，含 name/description/schema（原始 zod 字段映射）
- GET /tools/:name
  - 返回单个工具元数据；不存在时 404 tool_not_found
- GET /mcp/tools
  - 返回 MCP 风格清单：name/description/input_schema（基于 zod 的简化 JSON Schema）
- POST /invoke（需要 Token）
  - Header：Authorization: Bearer YOUR_TOKEN 或 x-api-key: YOUR_TOKEN
  - Body：
    ```json
    { "name": "tool_name", "args": { "k": "v" } }
    ```
  - 成功返回工具的执行结果：
    ```json
    { "content": [ { "type": "text", "text": "..." } ] }
    ```
  - 失败返回 4xx + 统一错误结构
- POST /mcp/invoke（需要 Token）
  - Header：Authorization: Bearer YOUR_TOKEN 或 x-api-key: YOUR_TOKEN
  - Body（两种兼容形态，等价）：
    ```json
    { "name": "tool_name", "arguments": { "k": "v" } }
    ```
    或
    ```json
    { "name": "tool_name", "args": { "k": "v" } }
    ```
  - 返回结构与 /invoke 相同（content 数组；失败返回统一错误结构）

示例（使用 curl）
```bash
# /invoke 示例
TOKEN=YOUR_TOKEN
curl -X POST \
  "$(printf "%s" "http://localhost:8788/invoke")" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"add","args":{"a":1,"b":2}}'

# /mcp/invoke 示例（使用 "arguments" 字段）
TOKEN=YOUR_TOKEN
curl -X POST \
  "$(printf "%s" "http://localhost:8788/mcp/invoke")" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"add","arguments":{"a":3,"b":4}}'
```

## 工具系统

基础类位于 src/utils/tools.ts：
- Tool 基类：name、description、schema（zod 字段映射），execute(args) 返回 { content, isError? }
- ToolRegistry：注册/查询/执行工具

工具实现位于 src/tools/*，例如加法工具：
```ts
export class AddTool extends Tool {
  constructor() {
    super('add','将两个数字相加',{ a: z.number(), b: z.number() });
  }
  async execute(args: { a:number; b:number }) { /* ... */ }
}
```

动态注册
- 构建期脚本：scripts/generate-tools-manifest.cjs 扫描 src/tools 下导出的 “export class Xxx extends Tool”，生成 src/tools/manifest.ts
- 运行期：functions/[[path]].ts 首次请求时读取 toolConstructors，逐个实例化并注册
- 命令：npm run gen:tools（在 dev/deploy/start 前会自动执行）

## 前端

- index.html + static/app.js（无外部依赖）
- 加载 /mcp/tools 渲染工具网格、搜索和示例抽屉
- 不直接发起 /invoke（避免 Token 暴露），仅给出 curl 示例

## 部署到 Cloudflare Pages

方式一：命令行
```bash
# 首次需 wrangler login
npm run gen:tools
wrangler pages deploy .
```

方式二：Pages 控制台
- 创建项目，连接仓库或上传构建产物
- Functions 目录自动识别为 functions/
- 设置环境变量：API_TOKENS=token1,token2（以及可选 Supabase 变量）
- 部署后访问 Pages 域名（首页、/health、/tools 等）

## 兼容性与规划

- 认证：仅 Token 鉴权；多 Token 支持；多租/审计留作后续扩展
- 存储：优先 Supabase（自建），通过 StorageAdapter/Factory 抽象支持多实现（占位中）
- MCP：已提供 /mcp/tools 与 /mcp/invoke（最小兼容）；后续将逐步对齐协议细节
- 迁移：保留横向迁移能力（Vercel/Deno/Supabase）

## 许可

MIT（如无特别声明）