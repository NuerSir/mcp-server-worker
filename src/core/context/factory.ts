import type { ContextAdapter } from './types';
import { CloudflarePagesAdapter } from './cloudflare-pages';

/**
 * 上下文适配器工厂
 */
export class ContextAdapterFactory {
  private static instance: ContextAdapterFactory;
  private adapter: ContextAdapter | null = null;

  private constructor() {}

  /**
   * 获取工厂单例
   */
  static getInstance(): ContextAdapterFactory {
    if (!ContextAdapterFactory.instance) {
      ContextAdapterFactory.instance = new ContextAdapterFactory();
    }
    return ContextAdapterFactory.instance;
  }

  /**
   * 创建上下文适配器
   */
  createAdapter(type?: string): ContextAdapter {
    if (this.adapter) {
      return this.adapter;
    }

    // 自动检测运行环境
    const detectedType = type || this.detectEnvironment();
    
    switch (detectedType) {
      case 'cloudflare-pages':
      case 'cloudflare-workers':
        this.adapter = new CloudflarePagesAdapter();
        break;
      case 'vercel':
        // TODO: 实现 Vercel 适配器
        throw new Error('Vercel adapter not implemented yet');
      case 'deno':
        // TODO: 实现 Deno 适配器
        throw new Error('Deno adapter not implemented yet');
      case 'node':
        // TODO: 实现 Node.js 适配器
        throw new Error('Node.js adapter not implemented yet');
      default:
        // 默认使用 Cloudflare Pages 适配器
        this.adapter = new CloudflarePagesAdapter();
    }

    return this.adapter;
  }

  /**
   * 自动检测运行环境
   */
  private detectEnvironment(): string {
    // 检测 Cloudflare Workers/Pages
    if (typeof globalThis.caches !== 'undefined' && typeof globalThis.Request !== 'undefined') {
      return 'cloudflare-pages';
    }

    // 检测 Vercel
    if (process.env.VERCEL) {
      return 'vercel';
    }

    // 检测 Deno
    if (typeof Deno !== 'undefined') {
      return 'deno';
    }

    // 检测 Node.js
    if (typeof process !== 'undefined' && process.versions?.node) {
      return 'node';
    }

    // 默认
    return 'cloudflare-pages';
  }

  /**
   * 重置适配器（用于测试）
   */
  reset(): void {
    this.adapter = null;
  }
}

/**
 * 获取默认上下文适配器
 */
export function getContextAdapter(): ContextAdapter {
  return ContextAdapterFactory.getInstance().createAdapter();
}