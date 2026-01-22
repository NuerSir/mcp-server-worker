# AGENTS.md

This file provides guidelines for AI agents working on this codebase.

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local Workers development server |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run dev:pages` | Start local Pages development server |
| `npm run deploy:pages` | Deploy to Cloudflare Pages |
| `npm run format` | Format code with Biome |
| `npm run lint:fix` | Lint and auto-fix issues with Biome |
| `npm run cf-typegen` | Generate Cloudflare type definitions |

## Deployment Targets

This project supports both Cloudflare Workers and Cloudflare Pages:

### Cloudflare Workers (Recommended)
- **Entry**: `src/index.ts`
- **Features**: Full feature support including Durable Objects
- **Deploy**: `npm run deploy`
- **Dev**: `npm run dev`

### Cloudflare Pages
- **Entry**: `pages/_worker.ts`
- **Features**: Static hosting + Pages Functions (no Durable Objects)
- **Deploy**: `npm run deploy:pages`
- **Dev**: `npm run dev:pages`

**Note**: The MCP server works on both platforms, but Workers is recommended for production due to better cold start performance and Durable Objects support.

## Code Style Guidelines

### Formatting
- **Indentation**: 4 spaces
- **Line width**: 100 characters
- Run `npm run format` before committing

### TypeScript
- Strict mode is enabled
- Use explicit return types for exported functions
- Avoid `any`; use `unknown` with type guards when needed
- Prefer interfaces over type aliases for object shapes
- Use `Record<K, V>` instead of `{ [key: string]: V }`

### Imports
- Use `.js` extension for imports from npm packages (e.g., `@modelcontextprotocol/sdk/server/mcp.js`)
- Group imports: external packages first, then relative imports
- Use named imports for single items: `import { Foo } from 'bar'`

### Naming Conventions
- **Classes**: PascalCase (e.g., `SequentialThinkingTool`)
- **Variables/functions**: camelCase (e.g., `toolRegistry`, `executeTool`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_KEY`)
- **Tool names**: lowercase with underscores (e.g., `sequentialthinking`)

### Error Handling
- Never throw errors in tool execution methods; return `{ content: [...], isError: true }`
- Always check for null/undefined before accessing properties
- Use `instanceof Error` before accessing `error.message`
- Log errors with clear prefixes: `console.error("[MCP] Error:", error)`

### Tool Implementation
- Extend the `Tool` base class
- Use Zod for parameter validation (via `z` from 'zod')
- Return format must be `{ content: Array<{ type: 'text', text: string }>, isError?: boolean }`
- Tools are auto-registered via `registerAllTools()` in `src/tools/index.ts`

### Code Patterns
- Prefer early returns over nested conditionals
- No useless else blocks after early returns
- No unused variables or imports
- Use `async/await` over raw promises
- Default parameters go last in function signatures
- Use const assertions (`as const`) for literal values
- Use single variable declarations (no comma-separated `let a = 1, b = 2`)

### Security
- Never log sensitive data (API keys, tokens, passwords)
- Validate all user inputs using Zod schemas
- Authenticate MCP requests before processing

### Cloudflare Workers Specifics
- Environment bindings are typed via `Bindings` interface
- Use `export default { async fetch(...) }` for entry point
- Keep cold starts in mind; prefer lazy initialization
- Durable Objects are used for MCP session management

## File Organization
```
src/
  index.ts          # Entry point (fetch handler)
  app.ts            # Hono app setup
  server.ts         # MCP request handling
  tools/            # MCP tool implementations
    index.ts        # Tool registration
    *.ts            # Individual tools
  utils/
    tools.ts        # Tool base class & registry
    env-config.ts   # Environment config helpers
```
