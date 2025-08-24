import type { ContextAdapter, RuntimeContext, CloudflareBindings } from './types';

/**
 * Cloudflare Pages Functions 上下文适配器
 */
export class CloudflarePagesAdapter implements ContextAdapter {
  readonly type = 'cloudflare-pages' as const;

  /**
   * 从 Cloudflare Pages 上下文创建统一上下文
   */
  createContext(rawContext: {
    request: Request;
    env: CloudflareBindings;
    executionContext?: ExecutionContext;
  }): RuntimeContext {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    return {
      env: rawContext.env || {},
      request: rawContext.request,
      executionContext: rawContext.executionContext,
      requestId,
      startTime,
    };
  }

  /**
   * 获取环境变量
   */
  getEnv(key: string): string | undefined {
    // 在 Cloudflare Pages 中，环境变量通过 env 对象访问
    // 这里需要从当前上下文获取，通常在中间件中设置
    return process.env[key] || globalThis.__CF_ENV__?.[key];
  }

  /**
   * 获取所有环境变量
   */
  getAllEnv(): Record<string, string | undefined> {
    // 合并 process.env 和 Cloudflare 绑定
    return {
      ...process.env,
      ...globalThis.__CF_ENV__,
    };
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 全局 Cloudflare 环境存储（用于在中间件中设置）
 */
declare global {
  var __CF_ENV__: CloudflareBindings | undefined;
}