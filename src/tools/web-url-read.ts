import { z } from "zod";
import { Tool } from "../utils/tools";
import { getEnvironmentConfig } from "../utils/env-config";

// Web URL 阅读工具实现
export class WebUrlReadTool extends Tool {
	constructor() {
		super(
			"web_url_read",
			"Read the content from an URL. " +
				"Use this for further information retrieving to understand the content of each URL.",
			{
				url: z.string().describe("URL to read content from"),
			},
		);
	}

	async execute(args: { url: string }) {
		try {
			const { url } = args;
			const content = await this.fetchAndProcess(url);

			return {
				content: [{ type: "text", text: content }],
				isError: false,
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error reading URL: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	}

	private async fetchAndProcess(url: string) {
		// 从环境配置获取超时设置
		const { TOOL_TIMEOUT_MS } = getEnvironmentConfig();

		// 创建一个 AbortController 实例用于超时控制
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), TOOL_TIMEOUT_MS);

		try {
			// 使用 abort 信号获取 URL
			const response = await fetch(url, {
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch the URL: ${response.statusText}`);
			}

			// 获取 HTML 内容
			const htmlContent = await response.text();

			// 因为我们无法在 Workers 环境中使用 NodeHtmlMarkdown，
			// 我们需要采用简单的 HTML 处理方法
			// 这里是一个简化版本，实际生产环境可能需要更复杂的解析逻辑
			const processedContent = this.simpleHtmlToText(htmlContent);

			return processedContent;
		} catch (error: any) {
			if (error.name === "AbortError") {
				throw new Error(`Request timed out after ${TOOL_TIMEOUT_MS}ms`);
			}
			throw error;
		} finally {
			// 清除超时以防止内存泄漏
			clearTimeout(timeoutId);
		}
	}

	private simpleHtmlToText(html: string): string {
		// 非常简单的 HTML 到文本转换
		// 移除所有 HTML 标签并保留文本内容
		// 注意：这是一个非常简化的实现，无法处理所有情况

		// 移除 scripts、styles 等不需要的部分
		let text = html
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
			.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
			.replace(/<[^>]+>/g, " ") // 移除所有 HTML 标签
			.replace(/\s{2,}/g, " ") // 压缩空格
			.trim();

		// 解码 HTML 实体
		text = text
			.replace(/&nbsp;/g, " ")
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'");

		return text;
	}
}
