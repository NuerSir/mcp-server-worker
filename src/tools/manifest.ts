/* 自动生成文件：请勿手动修改。运行 "npm run gen:tools" 可重新生成。*/
import { AddTool } from './add';
import { SequentialThinkingTool } from './sequentialthinking';
import { WebSearchTool } from './web-search';
import { WebUrlReadTool } from './web-url-read';

export const toolConstructors = [
  AddTool,
  SequentialThinkingTool,
  WebSearchTool,
  WebUrlReadTool
] as const;
