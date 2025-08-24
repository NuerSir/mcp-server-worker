/**
 * 存储抽象层类型与接口定义
 * 提供统一的键值存储接口，便于在不同后端之间快速切换（Memory / Supabase / R2 / VercelKV / DenoKV 等）
 */

/**
 * 存储后端标识
 * - memory：默认内存实现（开发/本地测试）
 * - supabase：Supabase(Postgres) 适配器（后续实现）
 * - r2 / vercel-kv / deno-kv：预留
 */
export type StorageBackend = 'memory' | 'supabase' | 'r2' | 'vercel-kv' | 'deno-kv';

/**
 * 存储初始化选项
 * - namespace：命名空间（用于隔离不同业务/环境的数据键）
 */
export interface StorageOptions {
  /** 命名空间（键前缀），例如：'prod' 或 'dev' */
  namespace?: string;
}

/**
 * List 操作的查询选项
 * - prefix：按键前缀过滤
 * - limit / cursor：分页能力（可选）
 */
export interface ListOptions {
  /** 键前缀过滤（无需包含 namespace） */
  prefix?: string;
  /** 限制返回数量 */
  limit?: number;
  /** 游标（翻页用） */
  cursor?: string;
}

/** List 操作返回值 */
export interface ListResult {
  /** 符合条件的键名列表（不包含 namespace 前缀） */
  keys: string[];
  /** 下一页游标（若有） */
  nextCursor?: string;
}

/** set 操作的选项 */
export interface SetOptions {
  /** 过期时间（秒），到期后可被清理或视为不存在 */
  ttlSeconds?: number;
}

/**
 * 统一的键值存储接口
 * - 所有实现需保证相同行为语义，以便无缝替换后端
 */
export interface StorageAdapter {
  /**
   * 读取单个键
   * @param key 业务键（无需包含 namespace）
   * @returns 解析后的值或 null（不存在）
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * 写入/覆盖单个键
   * @param key 业务键（无需包含 namespace）
   * @param value 任意可序列化值
   * @param options 可选项：ttlSeconds 过期秒数
   */
  set<T = unknown>(key: string, value: T, options?: SetOptions): Promise<void>;

  /**
   * 列出键（可按前缀过滤）
   * @param options 前缀/分页选项
   * @returns 列表与下一页游标
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * 删除单个键
   * @param key 业务键（无需包含 namespace）
   */
  del(key: string): Promise<void>;

  /**
   * 生成签名地址（可选，部分后端不支持）
   * @param key 业务键
   * @param opts 过期时间等
   * @returns 可直接访问的临时地址
   */
  signedUrl?(key: string, opts?: { expiresInSeconds?: number }): Promise<string>;

  /**
   * 关闭连接/释放资源（可选）
   */
  close?(): Promise<void>;
}