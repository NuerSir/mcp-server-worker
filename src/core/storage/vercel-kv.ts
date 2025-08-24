import type { StorageAdapter, StorageOptions, ListOptions, ListResult, SetOptions } from './types';

/**
 * Vercel KV 存储适配器配置选项
 */
export interface VercelKVOptions extends StorageOptions {
  /** Vercel KV REST API URL */
  url: string;
  /** Vercel KV REST API Token */
  token: string;
}

/**
 * Vercel KV 存储适配器（占位实现）
 * - 目标：通过 Vercel KV REST API 实现键值存储能力
 * - 当前仅提供类型与方法签名，均抛出"未实现"错误，便于后续平滑接入
 */
export class VercelKVStorage implements StorageAdapter {
  private readonly url: string;
  private readonly token: string;
  private readonly ns: string | undefined;

  constructor(options: VercelKVOptions) {
    this.url = options.url;
    this.token = options.token;
    this.ns = options.namespace?.trim() || undefined;
  }

  /** 统一的未实现错误 */
  private notImplemented(method: string): never {
    throw new Error(`Vercel KV 存储适配器尚未实现：${method}`);
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
    // HTTP 客户端无需关闭连接；占位空实现
    return;
  }
}

/**
 * 工厂方法：创建 Vercel KV 适配器（占位）
 */
export function createVercelKVStorage(options: VercelKVOptions): StorageAdapter {
  return new VercelKVStorage(options);
}