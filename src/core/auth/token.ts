import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * API Token 认证中间件
 * 
 * 支持两种方式：
 * 1. Authorization: Bearer <token>
 * 2. x-api-key: <token>
 * 
 * 从环境变量 API_TOKENS 中读取逗号分隔的 token 列表
 */
export const apiTokenAuth = () => {
  return async (c: Context, next: () => Promise<void>) => {
    // 从环境变量获取 API_TOKENS
    const apiTokensStr = c.env?.API_TOKENS;
    
    if (!apiTokensStr) {
      throw new HTTPException(401, {
        message: 'API_TOKENS environment variable is not configured',
        res: c.json({
          error: {
            code: 'config_missing',
            message: 'API_TOKENS environment variable is not configured'
          }
        })
      });
    }

    // 解析 API_TOKENS 为数组
    const apiTokens = apiTokensStr.split(',').map(token => token.trim());
    
    // 从请求头获取 token
    const authHeader = c.req.header('Authorization');
    const apiKeyHeader = c.req.header('x-api-key');
    
    let token: string | null = null;
    
    // 从 Authorization 头解析 Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } 
    // 从 x-api-key 头解析 token
    else if (apiKeyHeader) {
      token = apiKeyHeader;
    }
    
    // 验证 token
    if (!token || !apiTokens.includes(token)) {
      throw new HTTPException(401, {
        message: 'Invalid or missing API token',
        res: c.json({
          error: {
            code: 'unauthorized',
            message: 'Invalid or missing API token'
          }
        })
      });
    }
    
    // 验证通过，继续处理请求
    await next();
  };
};