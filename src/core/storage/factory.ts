import { createMemoryStorage } from './memory';
import { createSupabaseStorage } from './supabase';
import { createR2Storage } from './r2';
import { createVercelKVStorage } from './vercel-kv';
import { createDenoKVStorage } from './deno-kv';
import type { StorageAdapter, StorageBackend } from './types';

/**
 * 存储工厂（StorageFactory）
 * - 按环境变量或传入覆盖项选择存储后端与命名空间
 * - 默认使用内存存储（memory），便于本地与开发态
 *
 * 环境变量（Cloudflare Pages/本地均可）：
 * - STORAGE_BACKEND：可选 'memory' | 'supabase'（默认 'memory'）
 * - STORAGE_NAMESPACE：命名空间前缀（如 'dev' 或 'prod'）
 *
 * 说明：
 * - Supabase 适配器将在后续实现；当前选择 'supabase' 时会抛出未实现错误
 * - 读取优先级：overrides > bindings(env) > process.env > 默认值
 */

/** 工厂传入的环境绑定类型（Cloudflare Pages 的 c.env 或任意对象） */
export type EnvBindings = Record<string, any> | undefined;

/** 解析得到的存储环境配置 */
export interface StorageEnvConfig {
  /** 后端类型（memory/supabase 等） */
  backend: StorageBackend;
  /** 命名空间前缀 */
  namespace?: string;
  /** Supabase 相关（占位） */
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
}

/**
 * 从环境中读取变量（优先 bindings，其次 process.env）
 * @param bindings Cloudflare Pages 的环境绑定对象（或任意对象）
 * @param name 环境变量名
 */
function readVar(bindings: EnvBindings, name: string): string | undefined {
  const v = bindings && typeof bindings === 'object' ? bindings[name] : undefined;
  if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  try {
    const pv = typeof process !== 'undefined' && (process as any).env ? (process as any).env[name] : undefined;
    if (typeof pv === 'string' && pv.trim().length > 0) return pv.trim();
  } catch {
    // Cloudflare 环境下可能不存在 process 对象，安全忽略
  }
  return undefined;
}

/**
 * 解析环境配置（后端/命名空间等）
 * @param bindings 环境绑定
 * @param overrides 手动覆盖项（最高优先级）
 */
export function resolveStorageEnv(
  bindings?: EnvBindings,
  overrides?: Partial<StorageEnvConfig>
): StorageEnvConfig {
  const backendRaw =
    overrides?.backend ||
    (readVar(bindings, 'STORAGE_BACKEND') as StorageBackend | undefined) ||
    ('memory' as StorageBackend);

  const backend = normalizeBackend(backendRaw);

  const namespace =
    overrides?.namespace ||
    readVar(bindings, 'STORAGE_NAMESPACE') ||
    readVar(bindings, 'NAMESPACE'); // 兼容可能的命名

  const supabaseUrl = overrides?.supabaseUrl || readVar(bindings, 'SUPABASE_URL');
  const supabaseServiceRoleKey =
    overrides?.supabaseServiceRoleKey || readVar(bindings, 'SUPABASE_SERVICE_ROLE_KEY');

  return { backend, namespace, supabaseUrl, supabaseServiceRoleKey };
}

/**
 * 创建存储实例（StorageAdapter）
 * @param bindings 环境绑定（c.env 或 process.env）
 * @param overrides 可选覆盖（最高优先）
 */
export function createStorage(
  bindings?: EnvBindings,
  overrides?: Partial<StorageEnvConfig>
): StorageAdapter {
  const cfg = resolveStorageEnv(bindings, overrides);

  switch (cfg.backend) {
    case 'memory': {
      return createMemoryStorage({ namespace: cfg.namespace });
    }
    case 'supabase': {
      // 占位实现：创建 Supabase 适配器实例（其方法仍未实现，会在调用时抛错）
      const url = cfg.supabaseUrl;
      const key = cfg.supabaseServiceRoleKey;
      if (!url || !key) {
        throw new Error('Supabase 配置缺失（需 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY）');
      }
      return createSupabaseStorage({
        url,
        serviceRoleKey: key,
        namespace: cfg.namespace,
      });
    }
    case 'r2': {
      // R2 适配器（占位实现）
      console.warn(`[storage] R2 后端暂未实现，回退为 memory`);
      return createMemoryStorage({ namespace: cfg.namespace });
    }
    case 'vercel-kv': {
      // Vercel KV 适配器（占位实现）
      console.warn(`[storage] Vercel KV 后端暂未实现，回退为 memory`);
      return createMemoryStorage({ namespace: cfg.namespace });
    }
    case 'deno-kv': {
      // Deno KV 适配器（占位实现）
      console.warn(`[storage] Deno KV 后端暂未实现，回退为 memory`);
      return createMemoryStorage({ namespace: cfg.namespace });
    }
    default: {
      console.warn(`[storage] 未知后端 "${String(cfg.backend)}"，回退为 memory`);
      return createMemoryStorage({ namespace: cfg.namespace });
    }
  }
}

/**
 * 规范化后端字符串（大小写不敏感，连字符形式归一化）
 */
function normalizeBackend(v: string): StorageBackend {
  const n = String(v).toLowerCase().trim();
  if (n === 'memory') return 'memory';
  if (n === 'supabase') return 'supabase';
  if (n === 'r2') return 'r2';
  if (n === 'vercel-kv' || n === 'vercelkv' || n === 'vercel') return 'vercel-kv';
  if (n === 'deno-kv' || n === 'denokv' || n === 'deno') return 'deno-kv';
  return 'memory';
}