import type { StorageAdapter, StorageOptions, ListOptions, ListResult, SetOptions } from './types';

/**
 * Deno KV 存储适配器配置选项
 */
export interface DenoKVOptions extends StorageOptions {
  /** Deno KV 数据库路径（可选，默认使用默认数据库） */
  path?: string;
}

/**
 * Deno KV 存储适配器（占位实现）
 * - 目标：通过 Deno KV 实现键值存储能力
 * - 当前仅提供类型与方法签名，均抛出"未实现"错误，便于后续平滑接入
 */
export class DenoKVStorage implements StorageAdapter {
  private readonly path?: string;
  private readonly ns: string | undefined;

  constructor(options?: DenoKVOptions) {
    this.path = options?.path;
    this.ns = options?.namespace?.trim() || undefined;
  }

  /** 统一的未实现错误 */
  private notImplemented(method: string): never {
    throw new Error(`Deno KV 存储适配器尚未实现：${method}（path=${this.path || 'default'}）`);
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

  /** 关闭连接（如需） */
  async close(): Promise<void> {
    // Deno KV 可能需要关闭连接，但当前为占位实现
    return;
  }
}

/**
 * 工厂方法：创建 Deno KV 适配器（占位）
 */
export function createDenoKVStorage(options?: DenoKVOptions): StorageAdapter {
  return new DenoKVStorage(options);
}