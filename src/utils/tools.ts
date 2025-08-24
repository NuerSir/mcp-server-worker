import { z } from 'zod';

// 工具基类，提供通用功能和结构
export abstract class Tool {
    constructor(
        public readonly name: string,
        public readonly description: string,
        public readonly schema: Record<string, any> // 修改为支持直接的属性映射
    ) {}

    abstract execute(args: any): Promise<{
        content: Array<{ type: string, text: string }>;
        isError?: boolean;
    }>;
}

// 工具注册表，用于集中管理所有工具
export class ToolRegistry {
    private tools: Map<string, Tool> = new Map();

    constructor() {}

    registerTool(tool: Tool): void {
        if (this.tools.has(tool.name)) {
            console.warn(`Tool with name ${tool.name} already exists. Overwriting.`);
        }
        this.tools.set(tool.name, tool);
    }

    unregisterTool(name: string): boolean {
        return this.tools.delete(name);
    }

    clearAllTools(): void {
        this.tools.clear();
    }

    getTool(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    getAllTools(): Tool[] {
        return Array.from(this.tools.values());
    }

    getToolNames(): string[] {
        return Array.from(this.tools.keys());
    }

    hasTools(): boolean {
        return this.tools.size > 0;
    }

    getToolCount(): number {
        return this.tools.size;
    }

    async executeTool(name: string, args: any): Promise<{
        content: Array<{ type: string, text: string }>;
        isError?: boolean;
    }> {
        const tool = this.getTool(name);
        if (!tool) {
            return {
                content: [{ type: 'text', text: `Tool "${name}" not found` }],
                isError: true
            };
        }

        try {
            return await tool.execute(args);
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error executing tool "${name}": ${error instanceof Error ? error.message : String(error)}` }],
                isError: true
            };
        }
    }
}

// 单例工具注册表实例
export const toolRegistry = new ToolRegistry();