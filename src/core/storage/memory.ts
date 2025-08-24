import type {
  StorageAdapter,
  StorageOptions,
  ListOptions,
  ListResult,
  SetOptions,
} from './types';

/**
 * 内存存储实现（开发/测试环境）
 * - 进程内 Map 持久于实例生命周期
 * - 支持 TTL（过期在读时惰性清理）
 * - 支持按前缀列出键
 * 注意：无跨实例/跨进程持久化能力，生产环境请使用持久化后端
 */
export class MemoryStorage implements StorageAdapter {
  /** 命名空间（键前缀），形如：'ns:' */
  private readonly nsPrefix: string;
  /** 存储容器 */
  private readonly store = new Map<string, { value: unknown; expiresAt?: number }>();

  constructor(options?: StorageOptions) {
    const ns = options?.namespace?.trim();
    this.nsPrefix = ns ? `${ns}:` : '';
  }

  /**
   * 生成带命名空间的内部键
   */
  private k(key: string): string {
    return `${this.nsPrefix}${key}`;
  }

  /**
   * 判断条目是否过期
   */
  private isExpired(entry?: { expiresAt?: number }): boolean {
    if (!entry?.expiresAt) return false;
    return Date.now() >= entry.expiresAt;
  }

  /**
   * 惰性读取并在过期时清理
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const fullKey = this.k(key);
    const entry = this.store.get(fullKey);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(fullKey);
      return null;
    }
    return entry.value as T;
  }

  /**
   * 写入/覆盖键值，支持 TTL
   */
  async set<T = unknown>(key: string, value: T, options?: SetOptions): Promise<void> {
    const fullKey = this.k(key);
    const ttl = options?.ttlSeconds;
    const expiresAt = typeof ttl === 'number' && ttl > 0 ? Date.now() + ttl * 1000 : undefined;
    this.store.set(fullKey, { value, expiresAt });
  }

  /**
   * 列表：按可选前缀过滤，支持 limit/cursor（简易实现）
   */
  async list(options?: ListOptions): Promise<ListResult> {
    const prefix = (options?.prefix ?? '').trim();
    const limit = options?.limit ?? 100;
    const cursor = options?.cursor ? Number(options.cursor) : 0;

    const keys = Array.from(this.store.keys());
    const filtered: string[] = [];
    for (const fullKey of keys) {
      // 清理过期
      const entry = this.store.get(fullKey);
      if (this.isExpired(entry)) {
        this.store.delete(fullKey);
        continue;
      }
      // 过滤命名空间
      if (!fullKey.startsWith(this.nsPrefix)) continue;
      const bizKey = fullKey.slice(this.nsPrefix.length);
      if (prefix && !bizKey.startsWith(prefix)) continue;
      filtered.push(bizKey);
    }

    const slice = filtered.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < filtered.length ? String(cursor + limit) : undefined;

    return { keys: slice, nextCursor };
  }

  /**
   * 删除单个键
   */
  async del(key: string): Promise<void> {
    this.store.delete(this.k(key));
  }
}

/**
 * 工厂方法：创建内存存储实例
 * @param options 命名空间等选项
 */
export function createMemoryStorage(options?: StorageOptions): StorageAdapter {
  return new MemoryStorage(options);
}