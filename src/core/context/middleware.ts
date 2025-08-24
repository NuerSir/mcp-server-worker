import type { Context, Next } from 'hono';
import type { RuntimeContext, CloudflareBindings } from './types';
import { getContextAdapter } from './factory';

/**
 * 上下文中间件 - 统一处理运行时上下文
 */
export function contextMiddleware() {
  return async (c: Context, next: Next) => {
    const adapter = getContextAdapter();
    
    // 创建统一的运行时上下文
    const runtimeContext: RuntimeContext = adapter.createContext({
      request: c.req.raw,
      env: c.env as CloudflareBindings,
      executionContext: c.executionCtx,
    });

    // 将上下文存储到 Hono 上下文中
    c.set('runtimeContext', runtimeContext);
    
    // 设置全局环境变量（用于适配器访问）
    globalThis.__CF_ENV__ = runtimeContext.env;
    
    // 添加请求头信息
    c.header('X-Request-ID', runtimeContext.requestId);
    
    await next();
    
    // 计算请求处理时间
    const duration = Date.now() - runtimeContext.startTime;
    c.header('X-Response-Time', `${duration}ms`);
  };
}

/**
 * 从 Hono 上下文获取运行时上下文
 */
export function getRuntimeContext(c: Context): RuntimeContext {
  const context = c.get('runtimeContext') as RuntimeContext;
  if (!context) {
    throw new Error('Runtime context not found. Make sure contextMiddleware is applied.');
  }
  return context;
}

/**
 * 从 Hono 上下文获取环境绑定
 */
export function getEnvBindings(c: Context): CloudflareBindings {
  const context = getRuntimeContext(c);
  return context.env;
}

/**
 * 获取请求ID
 */
export function getRequestId(c: Context): string {
  const context = getRuntimeContext(c);
  return context.requestId;
}

/**
 * 获取请求开始时间
 */
export function getStartTime(c: Context): number {
  const context = getRuntimeContext(c);
  return context.startTime;
}