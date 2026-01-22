# worker-mcp

A high-performance MCP (Model Context Protocol) server running on Cloudflare Workers/Pages edge computing platforms.

## Features

- **Web Dashboard** - Visual interface to browse and test MCP tools
- **MCP Protocol** - Full JSON-RPC 2.0 support over HTTP/SSE
- **Built-in Tools**:
  - `add` - Simple addition calculator
  - `searxng_web_search` - Web search via SearXNG
  - `web_url_read` - Fetch and read URL content
  - `sequentialthinking` - Structured problem-solving tool

## Getting Started

### Install Dependencies

```bash
npm install
```

### Local Development

```bash
# Cloudflare Workers (recommended)
npm run dev

# Or Cloudflare Pages
npm run dev:pages
```

Open http://localhost:8787 in your browser to see the dashboard.

### Connect MCP Inspector

Use [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) to test your server:

```bash
npx @modelcontextprotocol/inspector
```

Configure the inspector:
- **Transport Type**: SSE
- **URL**: `http://localhost:8787/mcp`

<!--
SCREENSHOT PLACEHOLDER: MCP Inspector connection config
Capture: Inspector with SSE transport selected and URL field filled
Location: MCP Inspector "Configure" tab
Replace: mcp-inspector-config.png
-->

After connecting, you should see your available tools and be able to call them.

### Connect to Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "worker-mcp": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:8787/mcp"]
    }
  }
}
```

## Deployment

### Cloudflare Workers (Recommended)

```bash
npm run deploy
```

### Cloudflare Pages

```bash
npm run deploy:pages
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `API_KEY` | No | API key for MCP endpoint authentication |

## Project Structure

```
worker-mcp/
├── src/
│   ├── index.ts        # Workers entry point
│   ├── app.ts          # Hono web app (dashboard)
│   ├── server.ts       # MCP request handler
│   └── tools/          # MCP tool implementations
│       ├── index.ts
│       ├── add.ts
│       ├── web-search.ts
│       ├── web-url-read.ts
│       └── sequentialthinking.ts
├── pages/
│   ├── _worker.ts      # Pages Functions entry point
│   └── _routes.json    # Pages routing config
├── static/             # Static assets (dashboard UI)
├── wrangler.jsonc      # Workers configuration
├── package.json
└── biome.json          # Code formatting/linting
```

## API Endpoint

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web dashboard |
| `/mcp` | POST | MCP JSON-RPC 2.0 endpoint |

### MCP Endpoint

**URL**: `https://your-worker.workers.dev/mcp`

**Authentication** (if API_KEY is set):

```bash
# Via header
curl -H "Authorization: Bearer YOUR_API_KEY" https://your-worker.workers.dev/mcp

# Or via query parameter
curl https://your-worker.workers.dev/mcp?apiKey=YOUR_API_KEY
```

## Troubleshooting

### Clear MCP auth cache

```bash
rm -rf ~/.mcp-auth
```

### Check logs

```bash
npx wrangler tail
```

## License

MIT
