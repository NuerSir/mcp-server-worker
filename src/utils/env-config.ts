// 环境变量接口定义
export interface EnvironmentConfig {
    // SearXNG 搜索引擎 URL
    SEARXNG_URL: string;
    // 工具超时设置（毫秒）
    TOOL_TIMEOUT_MS: number;
    // 其他配置项可在此添加
}

// 默认环境配置
export const DEFAULT_ENV: EnvironmentConfig = {
    SEARXNG_URL: 'https://example.com/',
    TOOL_TIMEOUT_MS: 10000,
};

// 获取环境配置（结合默认值和实际环境值）
export function getEnvironmentConfig(): EnvironmentConfig {
    const env = { ...DEFAULT_ENV };

    // 在 Cloudflare Workers 环境中，可从全局对象获取配置
    if (typeof self !== 'undefined') {
        const globalScope = self as any;

        if (globalScope.SEARXNG_URL) {
            env.SEARXNG_URL = globalScope.SEARXNG_URL;
        }

        if (globalScope.TOOL_TIMEOUT_MS) {
            env.TOOL_TIMEOUT_MS = Number.parseInt(globalScope.TOOL_TIMEOUT_MS, 10);
        }
    }

    return env;
}