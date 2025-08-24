import { Hono } from 'hono';
import { createStorage } from '../src/core/storage';
import { toolConstructors } from '../src/tools/manifest';
import { toolRegistry } from '../src/utils/tools';
import { checkEnvironmentConfig, generateConfigReport, getEnvironmentConfig } from '../src/utils/env-config';
import type { StorageAdapter } from '../src/core/storage/types';
import { apiTokenAuth } from '../src/core/auth';
import { renderHomePage, type ToolInfo } from '../src/pages/home';
import { contextMiddleware, getEnvBindings, getRuntimeContext } from '../src/core/context';
import type { CloudflareBindings } from '../src/core/context';
import { performanceMiddleware } from '../src/core/middleware/performance';

/**
 * Cloudflare Pages Functions 入口（Hono）
 * 暴露以下路由：
 * - GET /health：健康检查
 * - GET /tools：公开的工具列表（名称、描述、原始 schema）
 * - GET /mcp/tools：MCP 风格只读工具清单（简化 input_schema）
 * - POST /invoke：执行工具（需要 Token；Authorization: Bearer 或 x-api-key）
 */

/** Hono 应用实例（绑定 Cloudflare Pages 环境） */
const app = new Hono<{ Bindings: CloudflareBindings }>();

// 应用中间件
app.use('*', performanceMiddleware({
  enableRequestId: true,
  enableTiming: true,
  includeHeaders: true,
  logSlowRequests: true,
  slowRequestThreshold: 1000, // 1秒
}));
app.use('*', contextMiddleware());

/** 是否已完成工具注册（进程级缓存，避免重复注册） */
let initialized = false;

/** 全局存储适配器实例（进程级缓存） */
let storageAdapter: StorageAdapter | null = null;

/**
 * 确保完成工具注册和存储初始化（基于自动生成的 manifest 构造并注册）
 * 仅在首次请求时执行，后续走缓存
 * @param c Hono 上下文
 */
function ensureInit(c: any): void {
  if (!initialized) {
    // 获取环境绑定
    const env = getEnvBindings(c);
    
    // 获取并检查环境配置
    const config = getEnvironmentConfig(env);
    const configCheck = checkEnvironmentConfig(config);
    
    // 输出配置检查报告
    console.log(generateConfigReport(config));
    
    if (!configCheck.valid) {
      console.warn('[Config] 环境配置缺失必要项，应用可能无法正常工作');
    }
    
    // 注册工具
    for (const Ctor of toolConstructors) {
      // 逐个构造并注册 Tool
      // @ts-ignore 保持对构造函数签名的宽松兼容
      toolRegistry.registerTool(new (Ctor as any)());
    }
    
    // 初始化存储
    try {
      const backend = config.STORAGE_BACKEND || 'memory';
      const namespace = config.STORAGE_NAMESPACE || 'default';
      
      // 创建存储适配器
      storageAdapter = createStorage(env, {
        backend: backend as 'memory' | 'supabase',
        namespace,
        supabaseUrl: config.SUPABASE_URL,
        supabaseServiceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY,
      });
      
      console.log(`[Storage] Initialized ${backend} storage with namespace "${namespace}"`);
    } catch (e) {
      console.error('[Storage] Failed to initialize storage:', e);
      // 存储初始化失败不阻止应用启动，但会在 /storage/ping 中报告错误
    }
    
    initialized = true;
  }
}

// 这些函数已经在 src/core/auth/token.ts 中实现，不再需要

// 使用导入的 apiTokenAuth 中间件替代内联实现

/**
 * 将 zod 字段描述总结为简化的 JSON Schema 结构（尽力而为）
 * 仅提取字段的类型名和描述，不推断 required
 * @param schemaObj 工具声明时传入的 zod 字段映射
 * @returns 简化后的 JSON Schema 片段
 */
function summarizeZodSchema(schemaObj: Record<string, any>) {
  const properties: Record<string, any> = {};
  for (const [key, val] of Object.entries(schemaObj || {})) {
    const anyVal: any = val;
    const def = anyVal?._def;
    const typeName = def?.typeName ?? typeof val;
    const description = def?.description;
    properties[key] = {
      type: String(typeName),
      description,
    };
  }
  return {
    type: 'object',
    properties,
    // 不强行推断 required/optional，留空交由前端或调用方处理
    required: [],
  };
}

/**
 * 健康检查
 * @returns 运行状态、名称、运行时、时间与工具数量
 */
app.get('/health', (c) => {
  ensureInit(c);
  
  // 获取环境配置状态
  const env = getEnvBindings(c);
  const config = getEnvironmentConfig(env);
  const configCheck = checkEnvironmentConfig(config);
  
  return c.json({
    ok: true,
    name: 'workers-mcp',
    runtime: 'cloudflare-pages',
    time: new Date().toISOString(),
    tools: toolRegistry.getAllTools().length,
    storage: storageAdapter ? {
      type: storageAdapter.type,
      namespace: storageAdapter.namespace,
    } : null,
    config: {
      valid: configCheck.valid,
      warnings: configCheck.warnings.length,
      missing: configCheck.missing,
    }
  });
});

/**
 * 环境配置检查（受保护）
 * 返回详细的环境配置检查报告
 */
app.get('/config', apiTokenAuth(), (c) => {
  ensureInit(c);
  const env = getEnvBindings(c);
  const config = getEnvironmentConfig(env);
  const result = checkEnvironmentConfig(config);
  
  return c.json({
    valid: result.valid,
    missing: result.missing,
    warnings: result.warnings,
    config: result.config,
  });
});

/**
 * 存储健康检查（受保护）
 * 尝试写入、读取和删除一个测试键值，验证存储是否正常工作
 */
app.get('/storage/ping', apiTokenAuth(), async (c) => {
  ensureInit(c);
  
  if (!storageAdapter) {
    return c.json({
      ok: false,
      error: 'Storage adapter not initialized',
    }, 500);
  }
  
  const testKey = `__ping_${Date.now()}`;
  const testValue = { time: new Date().toISOString(), random: Math.random() };
  const results = { set: false, get: false, delete: false };
  let error = null;
  
  try {
    // 测试写入
    await storageAdapter.set(testKey, testValue);
    results.set = true;
    
    // 测试读取
    const retrieved = await storageAdapter.get(testKey);
    results.get = JSON.stringify(retrieved) === JSON.stringify(testValue);
    
    // 测试删除
    await storageAdapter.delete(testKey);
    results.delete = true;
    
    // 验证删除成功
    const afterDelete = await storageAdapter.get(testKey);
    if (afterDelete !== null) {
      error = 'Delete operation did not remove the key';
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  
  return c.json({
    ok: !error,
    type: storageAdapter.type,
    namespace: storageAdapter.namespace,
    results,
    error,
  });
});

/**
 * 工具列表（公开）
 * @returns 工具名称、描述与原始 schema（zod 字段映射）
 */
app.get('/tools', (c) => {
  ensureInit(c);
  const tools = toolRegistry.getAllTools().map((t) => ({
    name: (t as any).name,
    description: (t as any).description,
    schema: (t as any).schema,
  }));
  return c.json({ tools });
});

/**
 * 获取单个工具元数据（公开）
 * @param name 工具名称
 * @returns 工具名称、描述与原始 schema；未找到时返回 404
 */
app.get('/tools/:name', (c) => {
  ensureInit(c);
  const name = c.req.param('name');
  const t = toolRegistry.getTool(name);
  if (!t) {
    return c.json({ error: { code: 'tool_not_found', message: `Tool "${name}" not found` } }, 404);
  }
  return c.json({
    tool: {
      name: (t as any).name,
      description: (t as any).description,
      schema: (t as any).schema,
    },
  });
});

/**
 * MCP 风格只读工具清单
 * 对齐 MCP 工具发现：返回 name、description 与 input_schema（简化）
 */
app.get('/mcp/tools', (c) => {
  ensureInit(c);
  const tools = toolRegistry.getAllTools().map((t) => ({
    name: (t as any).name,
    description: (t as any).description,
    input_schema: summarizeZodSchema((t as any).schema),
  }));
  return c.json({ tools });
});

/**
 * MCP 工具调用（受保护，最小兼容）
 * 请求体支持：
 * - { "name": string, "arguments": object }
 * - { "name": string, "args": object } // 兼容旧结构
 * 返回：与 /invoke 一致的 content 数组结构
 */
app.post('/mcp/invoke', apiTokenAuth(), async (c) => {
  ensureInit(c);
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: 'invalid_json', message: 'Invalid JSON body' } }, 400);
  }
  const name = body?.name;
  const args = body?.arguments ?? body?.args ?? {};
  if (!name || typeof name !== 'string') {
    return c.json({ error: { code: 'invalid_argument', message: 'Field "name" is required (string)' } }, 400);
  }
  const tool = toolRegistry.getTool(name);
  if (!tool) {
    return c.json({ error: { code: 'tool_not_found', message: `Tool "${name}" not found` } }, 404);
  }
  let result: any;
  try {
    // 直接调用具体工具的 execute，保留 Tool 内部的错误处理逻辑
    // @ts-ignore
    result = await (tool as any).execute(args);
  } catch (e) {
    result = {
      content: [
        {
          type: 'text',
          text: `Error executing tool "${name}": ${e instanceof Error ? e.message : String(e)}`,
        },
      ],
      isError: true,
    };
  }
  const status = result.isError ? 400 : 200;
  return c.json(result, status);
});

/**
 * 调用工具（受保护）
 * 请求体：
 * {
 *   "name": string,  // 工具名称
 *   "args": object   // 入参对象
 * }
 * @returns 工具执行结果（content 数组，可能包含 isError）
 */
app.post('/invoke', apiTokenAuth(), async (c) => {
  ensureInit(c);
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: 'invalid_json', message: 'Invalid JSON body' } }, 400);
  }
  const name = body?.name;
  const args = body?.args ?? {};
  if (!name || typeof name !== 'string') {
    return c.json({ error: { code: 'invalid_argument', message: 'Field "name" is required (string)' } }, 400);
    }
  const tool = toolRegistry.getTool(name);
  if (!tool) {
    return c.json({ error: { code: 'tool_not_found', message: `Tool "${name}" not found` } }, 404);
  }
  let result: any;
  try {
    // 直接调用具体工具的 execute，保留 Tool 内部的错误处理逻辑
    // @ts-ignore
    result = await (tool as any).execute(args);
  } catch (e) {
    result = {
      content: [
        {
          type: 'text',
          text: `Error executing tool "${name}": ${e instanceof Error ? e.message : String(e)}`,
        },
      ],
      isError: true,
    };
  }
  const status = result.isError ? 400 : 200;
  return c.json(result, status);
});

/**
 * 首页路由
 * 返回工具列表页面
 */
app.get('/', (c) => {
  ensureInit(c);
  const tools: ToolInfo[] = toolRegistry.getAllTools().map((t) => ({
    name: (t as any).name,
    description: (t as any).description,
    schema: (t as any).schema || {},
    status: 'active' as const,
  }));
  
  return c.html(renderHomePage(tools));
});

/**
 * Cloudflare Pages Functions 导出入口
 * @param context Cloudflare Pages 上下文
 */
export const onRequest = (context: any) => app.fetch(context.request, context.env, context);
