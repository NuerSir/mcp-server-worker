import { z } from "zod";
import { Tool } from "../utils/tools";

// 简单的加法工具
export class AddTool extends Tool {
	constructor() {
		super("add", "将两个数字相加并返回结果", {
			a: z.number().describe("第一个数字"),
			b: z.number().describe("第二个数字"),
		});
	}

	async execute(args: { a: number; b: number }) {
		const { a, b } = args;
		const result = a + b;
		return {
			content: [{ type: "text", text: String(result) }],
		};
	}
}
