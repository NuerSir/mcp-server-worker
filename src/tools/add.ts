import { z } from 'zod';
import { Tool } from '../utils/tools';

/**
 * 加法工具（AddTool）
 *
 * 功能：
 * - 将两个数字相加并返回结果
 *
 * 入参 Schema（基于 zod 字段映射）：
 * - a: number 第一个数字
 * - b: number 第二个数字
 */
export class AddTool extends Tool {
    constructor() {
        super(
            'add',
            '将两个数字相加并返回结果',
            { a: z.number().describe('第一个数字'), b: z.number().describe('第二个数字') }
        );
    }

    /**
     * 执行加法运算
     * @param args 入参对象
     * @param args.a 第一个数字
     * @param args.b 第二个数字
     * @returns 执行结果；content[0].text 为相加后的字符串
     */
    async execute(args: { a: number; b: number }) {
        const { a, b } = args;
        const result = a + b;
        return {
            content: [{ type: 'text', text: String(result) }]
        };
    }
}
