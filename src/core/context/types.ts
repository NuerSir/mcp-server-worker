/**
 * 运行时环境类型定义
 */

/** Cloudflare Pages Functions 环境绑定 */
export interface CloudflareBindings {
  /** 允许访问的 API Token，逗号分隔 */
  API_TOKENS?: string;
  /** Supabase URL */
  SUPABASE_URL?: string;
  /** Supabase Service Role Key */
  SUPABASE_SERVICE_ROLE_KEY?: string;
  /** 存储后端类型 */
  STORAGE_BACKEND?: 'memory' | 'supabase' | 'r2' | 'vercel-kv' | 'deno-kv';
  /** 存储命名空间 */
  STORAGE_NAMESPACE?: string;
  /** 环境标识 */
  ENVIRONMENT?: string;
  /** SearXNG URL */
  SEARXNG_URL?: string;
  /** R2 存储桶（如果使用 R2） */
  R2_BUCKET?: any;
  /** Vercel KV 实例（如果使用 Vercel KV） */
  VERCEL_KV?: any;
  /** Deno KV 实例（如果使用 Deno KV） */
  DENO_KV?: any;
}

/** 统一的运行时上下文 */
export interface RuntimeContext {
  /** 环境绑定 */
  env: CloudflareBindings;
  /** 请求对象 */
  request: Request;
  /** 执行上下文（可选） */
  executionContext?: ExecutionContext;
  /** 请求ID（用于日志追踪） */
  requestId: string;
  /** 请求开始时间 */
  startTime: number;
}

/** 上下文适配器接口 */
export interface ContextAdapter {
  /** 适配器类型 */
  type: 'cloudflare-pages' | 'cloudflare-workers' | 'vercel' | 'deno' | 'node';
  
  /** 从原始上下文创建统一上下文 */
  createContext(rawContext: any): RuntimeContext;
  
  /** 获取环境变量 */
  getEnv(key: string): string | undefined;
  
  /** 获取所有环境变量 */
  getAllEnv(): Record<string, string | undefined>;
}