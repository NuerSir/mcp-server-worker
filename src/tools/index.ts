import { toolConstructors } from './manifest';
import { toolRegistry } from '../utils/tools';

/**
 * 动态注册所有工具
 * 基于自动生成的 manifest.ts 文件，实现工具的动态发现与注册
 */
export function registerAllTools(): void {
    console.log(`[tools] 开始注册 ${toolConstructors.length} 个工具...`);
    
    for (const ToolConstructor of toolConstructors) {
        try {
            const toolInstance = new ToolConstructor();
            toolRegistry.registerTool(toolInstance);
            console.log(`[tools] 已注册工具: ${toolInstance.name}`);
        } catch (error) {
            console.error(`[tools] 注册工具失败: ${ToolConstructor.name}`, error);
        }
    }
    
    console.log(`[tools] 工具注册完成，共 ${toolRegistry.getAllTools().length} 个工具可用`);
}

/**
 * 获取所有已注册的工具信息
 */
export function getRegisteredToolsInfo() {
    const tools = toolRegistry.getAllTools();
    return tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        schema: tool.schema,
    }));
}

/**
 * 重新加载工具（开发环境热重载支持）
 */
export function reloadTools(): void {
    console.log(`[tools] 开始重新加载工具，当前已注册 ${toolRegistry.getToolCount()} 个工具`);
    
    // 清空当前注册的工具
    toolRegistry.clearAllTools();
    
    // 重新注册所有工具
    registerAllTools();
}

// 导出工具构造器供直接使用（保持向后兼容）
export { toolConstructors };
