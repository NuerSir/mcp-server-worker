import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OAuthProvider from "@cloudflare/workers-oauth-provider";

import app from "./app";

import { registerAllTools } from "./tools";
import { toolRegistry } from "./utils/tools";

export class MyMCP extends McpAgent {
    server = new McpServer({
        name: "Demo MCP Server",
        version: "1.0.0",
    });

    async init() {
        // 注册所有工具
        registerAllTools();
        
        // 动态注册所有工具到 MCP 服务器
        for (const tool of toolRegistry.getAllTools()) {
            this.server.tool(
                tool.name,
                tool.description,
                tool.schema,
                async (args): Promise<any> => {
                    return await toolRegistry.executeTool(tool.name, args);
                }
            );
        }
    }
}

// Export the OAuth handler as the default
export default new OAuthProvider({
    // TODO: fix these types
    apiHandlers: {
        // @ts-ignore
        '/sse': MyMCP.serveSSE('/sse'),
        // @ts-ignore
        '/mcp': MyMCP.serve('/mcp'),
    },
    // @ts-ignore
    defaultHandler: app,
    authorizeEndpoint: "/authorize",
    tokenEndpoint: "/token",
    clientRegistrationEndpoint: "/register",
});
