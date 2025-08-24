import type { StorageAdapter, StorageOptions, ListOptions, ListResult, SetOptions } from './types';

/**
 * Supabase 存储适配器（占位实现）
 * - 目标：通过 Supabase(PostgREST/Edge Functions/SDK) 实现 KV 能力
 * - 当前仅提供类型与方法签名，均抛出“未实现”错误，便于后续平滑接入
 *
 * 预计后续实现路径（二选一或混合）：
 * 1) 基于 PostgREST 直接对表进行 CRUD（需建表：kv(namespace, key, value, ttl/expires_at, ...)，并加唯一索引）
 * 2) 使用 Edge Functions 封装服务端逻辑，提高灵活性与权限控制
 */
export interface SupabaseOptions extends StorageOptions {
  /** Supabase 项目 URL（如：https://xxx.supabase.co） */
  url: string;
  /** Supabase Service Role Key（仅在受信环境使用） */
  serviceRoleKey: string;
  /** 使用的 schema 名称（可选，默认 public） */
  schema?: string;
  /** 使用的表名（可选，默认 kv） */
  table?: string;
}

/**
 * Supabase 存储适配器（尚未实现，方法将抛出错误）
 */
export class SupabaseStorage implements StorageAdapter {
  private readonly url: string;
  private readonly key: string;
  private readonly ns: string | undefined;
  private readonly schema: string;
  private readonly table: string;

  constructor(options: SupabaseOptions) {
    this.url = options.url;
    this.key = options.serviceRoleKey;
    this.ns = options.namespace?.trim() || undefined;
    this.schema = options.schema?.trim() || 'public';
    this.table = options.table?.trim() || 'kv';
  }

  /** 统一的未实现错误 */
  private notImplemented(method: string): never {
    throw new Error(`Supabase 存储适配器尚未实现：${method}（schema=${this.schema}, table=${this.table}）`);
  }

  /**
   * 读取键
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    this.notImplemented('get');
  }

  /**
   * 写入/覆盖键
   */
  async set<T = unknown>(key: string, value: T, options?: SetOptions): Promise<void> {
    this.notImplemented('set');
  }

  /**
   * 列出键（按前缀、分页）
   */
  async list(options?: ListOptions): Promise<ListResult> {
    this.notImplemented('list');
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<void> {
    this.notImplemented('del');
  }

  /**
   * 生成签名地址（若采用存储桶/对象存储时可实现）
   */
  async signedUrl(key: string, opts?: { expiresInSeconds?: number }): Promise<string> {
    this.notImplemented('signedUrl');
  }

  /** 关闭连接（如需） */
  async close(): Promise<void> {
    // 大多数 HTTP 方案无需关闭；占位空实现
    return;
  }
}

/**
 * 工厂方法：创建 Supabase 适配器（占位）
 */
export function createSupabaseStorage(options: SupabaseOptions): StorageAdapter {
  return new SupabaseStorage(options);
}