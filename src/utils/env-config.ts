/**
 * 环境变量配置接口
 * 包含应用所需的所有环境变量定义
 */
export interface EnvironmentConfig {
  /** API Token 列表（逗号分隔） */
  API_TOKENS?: string;
  
  /** 存储后端类型 */
  STORAGE_BACKEND?: 'memory' | 'supabase';
  
  /** 存储命名空间 */
  STORAGE_NAMESPACE?: string;
  
  /** Supabase URL（仅当 STORAGE_BACKEND=supabase 时需要） */
  SUPABASE_URL?: string;
  
  /** Supabase Service Role Key（仅当 STORAGE_BACKEND=supabase 时需要） */
  SUPABASE_SERVICE_ROLE_KEY?: string;
  
  /** SearXNG 搜索引擎 URL（用于 web-search 工具） */
  SEARXNG_URL?: string;
  
  /** 工具执行超时时间（毫秒） */
  TOOL_TIMEOUT_MS?: number;
}

/**
 * 默认环境配置
 * 当环境变量未设置时使用这些默认值
 */
export const DEFAULT_ENV: EnvironmentConfig = {
  STORAGE_BACKEND: 'memory',
  STORAGE_NAMESPACE: 'default',
  SEARXNG_URL: 'https://seek.nuer.cc',
  TOOL_TIMEOUT_MS: 10000,
};

/**
 * 环境变量配置项元数据
 * 用于生成配置检查报告
 */
export interface EnvVarMetadata {
  /** 环境变量名称 */
  name: string;
  /** 环境变量描述 */
  description: string;
  /** 是否必需 */
  required: boolean;
  /** 依赖条件（函数形式，接收完整配置对象） */
  requiredIf?: (config: EnvironmentConfig) => boolean;
  /** 默认值（如果有） */
  defaultValue?: any;
  /** 示例值 */
  example?: string;
}

/**
 * 环境变量配置项元数据定义
 */
export const ENV_VARS_METADATA: EnvVarMetadata[] = [
  {
    name: 'API_TOKENS',
    description: 'API Token 列表（逗号分隔，用于鉴权）',
    required: true,
    example: 'token1,token2,token3',
  },
  {
    name: 'STORAGE_BACKEND',
    description: '存储后端类型',
    required: false,
    defaultValue: 'memory',
    example: 'memory 或 supabase',
  },
  {
    name: 'STORAGE_NAMESPACE',
    description: '存储命名空间（用于隔离不同环境的数据）',
    required: false,
    defaultValue: 'default',
    example: 'prod 或 dev',
  },
  {
    name: 'SUPABASE_URL',
    description: 'Supabase 项目 URL',
    required: false,
    requiredIf: (config) => config.STORAGE_BACKEND === 'supabase',
    example: 'https://xxxxxxxxxxxx.supabase.co',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase Service Role Key（具有完全访问权限）',
    required: false,
    requiredIf: (config) => config.STORAGE_BACKEND === 'supabase',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  {
    name: 'SEARXNG_URL',
    description: 'SearXNG 搜索引擎 URL（用于 web-search 工具）',
    required: false,
    defaultValue: 'https://seek.nuer.cc',
    example: 'https://seek.nuer.cc',
  },
  {
    name: 'TOOL_TIMEOUT_MS',
    description: '工具执行超时时间（毫秒）',
    required: false,
    defaultValue: 10000,
    example: '10000',
  },
];

/**
 * 配置检查结果
 */
export interface ConfigCheckResult {
  /** 是否通过所有必要检查 */
  valid: boolean;
  /** 缺失的必要配置项 */
  missing: string[];
  /** 警告信息 */
  warnings: string[];
  /** 当前配置值（脱敏后） */
  config: Record<string, string>;
}

/**
 * 从环境中获取配置
 * 优先从 Cloudflare Pages 环境变量中获取，其次从 Node.js process.env 获取
 * @param env Cloudflare Pages 环境对象
 * @returns 合并后的环境配置
 */
export function getEnvironmentConfig(env?: Record<string, any>): EnvironmentConfig {
  const config = { ...DEFAULT_ENV };
  
  // 尝试从 Cloudflare Pages 环境获取
  if (env) {
    for (const key of Object.keys(config) as (keyof EnvironmentConfig)[]) {
      if (env[key] !== undefined) {
        (config as any)[key] = env[key];
      }
    }
  }
  
  // 尝试从 Node.js process.env 获取（本地开发环境）
  try {
    if (typeof process !== 'undefined' && process.env) {
      for (const key of Object.keys(config) as (keyof EnvironmentConfig)[]) {
        if (process.env[key] !== undefined) {
          const value = process.env[key];
          
          // 对数值类型进行转换
          if (key === 'TOOL_TIMEOUT_MS' && value) {
            (config as any)[key] = parseInt(value, 10);
          } else {
            (config as any)[key] = value;
          }
        }
      }
    }
  } catch (e) {
    // 在某些环境中可能没有 process 对象，忽略错误
    console.debug('无法从 process.env 读取环境变量', e);
  }
  
  return config;
}

/**
 * 检查环境配置是否满足要求
 * @param config 当前环境配置
 * @returns 检查结果，包含是否有效、缺失项和警告
 */
export function checkEnvironmentConfig(config: EnvironmentConfig): ConfigCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const safeConfig: Record<string, string> = {};
  
  // 检查每个环境变量
  for (const meta of ENV_VARS_METADATA) {
    const { name, required, requiredIf } = meta;
    const value = (config as any)[name];
    
    // 检查是否缺失必要配置
    const isRequired = required || (requiredIf && requiredIf(config));
    
    if (isRequired && (value === undefined || value === null || value === '')) {
      missing.push(name);
    }
    
    // 生成安全的配置对象（用于日志输出）
    if (value !== undefined && value !== null) {
      if (name.includes('KEY') || name.includes('TOKEN') || name.includes('SECRET')) {
        // 敏感信息脱敏
        safeConfig[name] = typeof value === 'string' 
          ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}`
          : '[敏感信息]';
      } else {
        safeConfig[name] = String(value);
      }
    } else {
      safeConfig[name] = '[未设置]';
    }
  }
  
  // 特殊检查：如果使用 supabase 后端但缺少配置
  if (config.STORAGE_BACKEND === 'supabase') {
    if (!config.SUPABASE_URL) {
      warnings.push('使用 Supabase 存储后端但未设置 SUPABASE_URL');
    }
    if (!config.SUPABASE_SERVICE_ROLE_KEY) {
      warnings.push('使用 Supabase 存储后端但未设置 SUPABASE_SERVICE_ROLE_KEY');
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings,
    config: safeConfig,
  };
}

/**
 * 生成环境配置检查报告
 * @param config 当前环境配置
 * @returns 格式化的检查报告字符串
 */
export function generateConfigReport(config: EnvironmentConfig): string {
  const result = checkEnvironmentConfig(config);
  const lines: string[] = [];
  
  lines.push('=== 环境配置检查报告 ===');
  lines.push(`状态: ${result.valid ? '✅ 有效' : '❌ 无效'}`);
  
  if (result.missing.length > 0) {
    lines.push('\n缺失的必要配置:');
    for (const name of result.missing) {
      const meta = ENV_VARS_METADATA.find(m => m.name === name);
      lines.push(`  - ${name}: ${meta?.description || ''}`);
      if (meta?.example) {
        lines.push(`    示例: ${meta.example}`);
      }
    }
  }
  
  if (result.warnings.length > 0) {
    lines.push('\n警告:');
    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`);
    }
  }
  
  lines.push('\n当前配置:');
  for (const [key, value] of Object.entries(result.config)) {
    lines.push(`  - ${key}: ${value}`);
  }
  
  return lines.join('\n');
}
