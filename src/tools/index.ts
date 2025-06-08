import { AddTool } from './add';
import { WebSearchTool } from './web-search';
import { WebUrlReadTool } from './web-url-read';
import { SequentialThinkingTool } from './sequentialthinking';
import { toolRegistry } from '../utils/tools';

// 注册所有工具的函数
export function registerAllTools(): void {
    // 注册基础计算工具
    toolRegistry.registerTool(new AddTool());
    
    // 注册网络搜索工具
    toolRegistry.registerTool(new WebSearchTool());
    
    // 注册URL阅读工具
    toolRegistry.registerTool(new WebUrlReadTool());
    
    // 注册 SequentialThinking 工具
    toolRegistry.registerTool(new SequentialThinkingTool());
    
    // 可在此处添加更多工具注册
    // toolRegistry.registerTool(new SomeOtherTool());
}

// 导出所有工具类供直接使用
export { AddTool, WebSearchTool, WebUrlReadTool, SequentialThinkingTool };