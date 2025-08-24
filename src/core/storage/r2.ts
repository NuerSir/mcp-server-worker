import type { StorageAdapter, StorageOptions, ListOptions, ListResult, SetOptions } from './types';

/**
 * R2 存储适配器配置选项
 */
export interface R2Options extends StorageOptions {
  /** R2 存储桶名称 */
  bucketName: string;
  /** 可选的自定义域名（用于生成签名URL） */
  customDomain?: string;
}

/**
 * R2 存储适配器（占位实现）
 * - 目标：通过 Cloudflare R2 实现对象存储能力
 * - 当前仅提供类型与方法签名，均抛出"未实现"错误，便于后续平滑接入
 */
export class R2Storage implements StorageAdapter {
  private readonly bucketName: string;
  private readonly ns: string | undefined;
  private readonly customDomain?: string;

  constructor(options: R2Options) {
    this.bucketName = options.bucketName;
    this.ns = options.namespace?.trim() || undefined;
    this.customDomain = options.customDomain;
  }

  /** 统一的未实现错误 */
  private notImplemented(method: string): never {
    throw new Error(`R2 存储适配器尚未实现：${method}（bucket=${this.bucketName}）`);
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
   * 生成签名地址（R2 原生支持）
   */
  async signedUrl(key: string, opts?: { expiresInSeconds?: number }): Promise<string> {
    this.notImplemented('signedUrl');
  }

  /** 关闭连接（如需） */
  async close(): Promise<void> {
    // R2 无需关闭连接；占位空实现
    return;
  }
}

/**
 * 工厂方法：创建 R2 适配器（占位）
 */
export function createR2Storage(options: R2Options): StorageAdapter {
  return new R2Storage(options);
}