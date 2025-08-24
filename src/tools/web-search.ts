import { z } from 'zod';
import { Tool } from '../utils/tools';
import { getEnvironmentConfig } from '../utils/env-config';

/**
 * Web 搜索工具（WebSearchTool）
 *
 * 功能：
 * - 基于 SearXNG 接口进行网页搜索，适合通用查询、新闻、文章与在线内容检索
 *
 * 入参 Schema（zod）：
 * - query: 搜索关键词（必填）
 * - pageno: 页码（从 1 起）
 * - time_range: 时间范围（'day' | 'month' | 'year'）
 * - language: 语言代码（如 'en'、'fr'、'de'），默认 'all'
 * - safesearch: 安全搜索级别（'0' 无、'1' 中等、'2' 严格）
 */
export class WebSearchTool extends Tool {
    constructor() {
        super(
            'searxng_web_search',
            'Performs a web search using the SearXNG API, ideal for general queries, news, articles, and online content. ' +
            'Use this for broad information gathering, recent events, or when you need diverse web sources.',
            {
                query: z.string().describe('The search query. This is the main input for the web search'),
                pageno: z.number().optional().default(1).describe('Search page number (starts at 1)'),
                time_range: z.enum(['day', 'month', 'year']).optional().describe('Time range of search (day, month, year)'),
                language: z.string().optional().default('all').describe('Language code for search results (e.g., \'en\', \'fr\', \'de\'). Default is instance-dependent.'),
                safesearch: z.enum(['0', '1', '2']).optional().default('0').describe('Safe search filter level (0: None, 1: Moderate, 2: Strict)')
            }
        );
    }

    /**
     * 执行网页搜索
     * @param args 入参对象
     * @param args.query 搜索关键词
     * @param args.pageno 搜索页码（默认 1）
     * @param args.time_range 时间范围（可选：'day' | 'month' | 'year'）
     * @param args.language 语言代码（默认 'all'）
     * @param args.safesearch 安全搜索级别（'0' | '1' | '2'，默认 '0'）
     * @returns 执行结果；成功时 content[0].text 返回拼接的搜索结果文本
     */
    async execute(args: {
        query: string;
        pageno?: number;
        time_range?: string;
        language?: string;
        safesearch?: string;
    }) {
        try {
            const {
                query,
                pageno = 1,
                time_range,
                language = 'all',
                safesearch = '0'
            } = args;

            const results = await this.performWebSearch(
                query,
                pageno,
                time_range,
                language,
                safesearch
            );

            return {
                content: [{ type: 'text', text: results }],
                isError: false
            };
        } catch (error) {
            return {
                content: [{ 
                    type: 'text', 
                    text: `Error in web search: ${error instanceof Error ? error.message : String(error)}` 
                }],
                isError: true
            };
        }
    }

    /**
     * 调用 SearXNG 完成搜索请求
     * @param query 搜索关键词
     * @param pageno 页码（默认 1）
     * @param time_range 时间范围（可选）
     * @param language 语言代码（默认 'all'）
     * @param safesearch 安全搜索级别（'0' | '1' | '2'，默认 '0'）
     * @throws 当 HTTP 状态非 2xx 时抛出错误
     * @returns 将搜索结果转换为纯文本的字符串
     */
    private async performWebSearch(
        query: string,
        pageno: number = 1,
        time_range?: string,
        language: string = 'all',
        safesearch: string = '0'
    ) {
        // 使用环境配置获取 SearXNG URL
        const { SEARXNG_URL } = getEnvironmentConfig();
        
        const url = new URL(`${SEARXNG_URL}/search`);
        url.searchParams.set('q', query);
        url.searchParams.set('format', 'json');
        url.searchParams.set('pageno', pageno.toString());

        if (time_range !== undefined && ['day', 'month', 'year'].includes(time_range)) {
            url.searchParams.set('time_range', time_range);
        }

        if (language && language !== 'all') {
            url.searchParams.set('language', language);
        }

        if (safesearch !== undefined && ['0', '1', '2'].includes(safesearch)) {
            url.searchParams.set('safesearch', safesearch);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(
                `SearXNG API error: ${response.status} ${response.statusText}\n${await response.text()}`
            );
        }

        const data = await response.json() as {
            results: Array<{
                title: string;
                content: string;
                url: string;
            }>;
        };

        const results = (data.results || []).map((result) => ({
            title: result.title || '',
            content: result.content || '',
            url: result.url || '',
        }));

        return results
            .map((r) => `Title: ${r.title}\nDescription: ${r.content}\nURL: ${r.url}`)
            .join('\n\n');
    }
}