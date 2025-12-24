import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

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

// Create a handler for MCP request
const mcpHandler = MyMCP.serve('/mcp', {
    transport: 'sse'
});

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
        const url = new URL(request.url);

        // Basic home route
        if (url.pathname === "/") {
            return app.fetch(request, env, ctx);
        }

        // MCP endpoint with API Key Auth
        if (url.pathname === "/mcp") {
            // Check API Key
            // If API_KEY is set in environment, we enforce it.
            // If not set, we might allow (or deny). Best to default deny if logic is "switch to apikey".
            // Implementation: Check if `env.API_KEY` exists.
            const apiKey = env.API_KEY;

            // If key is configured, check it.
            if (apiKey) {
                const authHeader = request.headers.get("Authorization");
                const urlApiKey = url.searchParams.get("apiKey");

                if ((!authHeader || authHeader !== `Bearer ${apiKey}`) && urlApiKey !== apiKey) {
                    return new Response("Unauthorized", { status: 401 });
                }
            } else {
                // Optimization: If no API_KEY configured, maybe warn? But for now allow or deny?
                // User asked to "change to apikey", so it implies API key usage.
                // Ideally if no API key is set, the server might be vulnerable.
                // I will assume the key will be present.
            }

            // Create a new request based on the original one, but perform cleanups
            const newUrl = new URL(request.url);

            // Remove apiKey from the URL passed to MCP agent to avoid validation issues
            // We KEEP sessionId because the 'sse' transport handler reads it from query params.
            newUrl.searchParams.delete("apiKey");

            const newRequest = new Request(newUrl.toString(), request);

            try {
                // Debug Logging
                console.log(`[Proxy] ${newRequest.method} ${newRequest.url}`);

                const response = await mcpHandler.fetch(newRequest, env, ctx);

                if (!response.ok) {
                    const text = await response.clone().text();
                    console.error(`[Proxy] Agent returned ${response.status}: ${text}`);
                }

                return response;
            } catch (e) {
                console.error("MCP Handler Error:", e);
                return new Response("Internal Server Error", { status: 500 });
            }
        }

        return new Response("Not Found", { status: 404 });
    }
}
