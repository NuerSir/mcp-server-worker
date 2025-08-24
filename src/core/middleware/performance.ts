import type { Context, Next } from 'hono';
import { v4 as uuidv4 } from 'uuid';

/**
 * 性能监控中间件配置
 */
export interface PerformanceConfig {
  /** 是否启用请求ID */
  enableRequestId?: boolean;
  /** 是否启用性能计时 */
  enableTiming?: boolean;
  /** 是否在响应头中包含性能指标 */
  includeHeaders?: boolean;
  /** 是否记录慢请求日志 */
  logSlowRequests?: boolean;
  /** 慢请求阈值（毫秒） */
  slowRequestThreshold?: number;
}

/**
 * 请求性能指标
 */
export interface RequestMetrics {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  userAgent?: string;
  ip?: string;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<PerformanceConfig> = {
  enableRequestId: true,
  enableTiming: true,
  includeHeaders: true,
  logSlowRequests: true,
  slowRequestThreshold: 1000, // 1秒
};

/**
 * 性能监控与请求ID中间件
 * 
 * 功能：
 * - 为每个请求生成唯一ID
 * - 记录请求处理时间
 * - 在响应头中包含性能指标
 * - 记录慢请求日志
 * 
 * @param config 配置选项
 * @returns Hono 中间件函数
 */
export function performanceMiddleware(config: PerformanceConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async (c: Context, next: Next) => {
    const metrics: RequestMetrics = {
      requestId: finalConfig.enableRequestId ? generateRequestId() : '',
      method: c.req.method,
      path: c.req.path,
      startTime: Date.now(),
    };

    // 设置请求ID到上下文
    if (finalConfig.enableRequestId) {
      c.set('requestId', metrics.requestId);
    }

    // 获取客户端信息
    if (finalConfig.enableTiming) {
      metrics.userAgent = c.req.header('user-agent');
      metrics.ip = getClientIP(c);
    }

    try {
      // 执行下一个中间件/路由处理器
      await next();

      // 记录结束时间和状态
      if (finalConfig.enableTiming) {
        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.status = c.res.status;
      }

      // 添加性能头
      if (finalConfig.includeHeaders) {
        addPerformanceHeaders(c, metrics);
      }

      // 记录慢请求
      if (finalConfig.logSlowRequests && metrics.duration && metrics.duration > finalConfig.slowRequestThreshold) {
        logSlowRequest(metrics);
      }

      // 记录正常请求（可选）
      logRequest(metrics);

    } catch (error) {
      // 记录错误请求
      if (finalConfig.enableTiming) {
        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.status = 500;
      }

      logErrorRequest(metrics, error);
      throw error;
    }
  };
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  // 使用时间戳 + 随机数生成短ID，避免依赖外部库
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * 获取客户端IP地址
 */
function getClientIP(c: Context): string {
  // Cloudflare 环境下的IP获取
  return c.req.header('cf-connecting-ip') || 
         c.req.header('x-forwarded-for') || 
         c.req.header('x-real-ip') || 
         'unknown';
}

/**
 * 添加性能相关的响应头
 */
function addPerformanceHeaders(c: Context, metrics: RequestMetrics) {
  if (metrics.requestId) {
    c.res.headers.set('x-request-id', metrics.requestId);
  }
  
  if (metrics.duration !== undefined) {
    c.res.headers.set('x-response-time', `${metrics.duration}ms`);
  }
  
  // 添加服务器时间戳
  c.res.headers.set('x-timestamp', new Date().toISOString());
}

/**
 * 记录正常请求
 */
function logRequest(metrics: RequestMetrics) {
  if (metrics.duration !== undefined) {
    console.log(`[${metrics.requestId}] ${metrics.method} ${metrics.path} - ${metrics.status} (${metrics.duration}ms)`);
  }
}

/**
 * 记录慢请求
 */
function logSlowRequest(metrics: RequestMetrics) {
  console.warn(`[SLOW REQUEST] [${metrics.requestId}] ${metrics.method} ${metrics.path} - ${metrics.status} (${metrics.duration}ms) - IP: ${metrics.ip}`);
}

/**
 * 记录错误请求
 */
function logErrorRequest(metrics: RequestMetrics, error: any) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[ERROR] [${metrics.requestId}] ${metrics.method} ${metrics.path} - ${metrics.status || 500} (${metrics.duration || 0}ms) - ${errorMessage}`);
}

/**
 * 获取当前请求的性能指标（用于在路由处理器中访问）
 */
export function getRequestMetrics(c: Context): Partial<RequestMetrics> {
  return {
    requestId: c.get('requestId'),
    method: c.req.method,
    path: c.req.path,
  };
}