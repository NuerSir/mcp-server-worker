import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerAllTools } from "./tools";
import { toolRegistry } from "./utils/tools";

/**
 * 创建 MCP 服务器实例
 */
function createMcpServer(): McpServer {
    const server = new McpServer({
        name: "Worker MCP Server",
        version: "1.0.0",
    });

    // 注册所有工具
    registerAllTools();

    // 动态注册工具到 MCP 服务器
    for (const tool of toolRegistry.getAllTools()) {
        server.tool(
            tool.name,
            tool.description,
            tool.schema,
            async (args): Promise<any> => {
                return await toolRegistry.executeTool(tool.name, args);
            }
        );
    }

    return server;
}

// 全局服务器实例和传输
let serverInstance: McpServer | null = null;
let clientTransport: ReturnType<typeof InMemoryTransport.createLinkedPair>[0] | null = null;
let serverTransport: ReturnType<typeof InMemoryTransport.createLinkedPair>[1] | null = null;
let isConnected = false;

async function ensureServerConnected() {
    if (!isConnected) {
        serverInstance = createMcpServer();
        const [client, server] = InMemoryTransport.createLinkedPair();
        clientTransport = client;
        serverTransport = server;
        await serverInstance.connect(serverTransport);
        isConnected = true;
    }
    return { server: serverInstance!, client: clientTransport! };
}

/**
 * 处理 MCP 请求 - 使用 InMemoryTransport 并转换为 HTTP Response
 */
export async function handleMcpRequest(request: Request): Promise<Response> {
    try {
        const body = await request.text();
        const jsonRpcRequest = JSON.parse(body);

        console.log("[MCP] Request:", JSON.stringify(jsonRpcRequest));

        // 处理通知 (notification) - 没有 id 字段的请求不需要响应
        // MCP 协议中，通知不需要返回任何内容
        if (jsonRpcRequest.id === undefined) {
            console.log("[MCP] Notification received, no response needed");
            // 仍然发送到服务器处理，但立即返回成功
            const { client } = await ensureServerConnected();
            client.send(jsonRpcRequest).catch((error: Error) => {
                console.error("[MCP] Notification send error:", error);
            });

            // 返回空的成功响应 (SSE 格式)
            return new Response("", {
                status: 202,
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Mcp-Session-Id": "stateless-session",
                },
            });
        }

        const { client } = await ensureServerConnected();

        // 通过 client transport 发送请求并等待响应
        return new Promise<Response>((resolve) => {
            const messageHandler = (message: any) => {
                // 检查是否是对当前请求的响应
                if (message.id === jsonRpcRequest.id ||
                    (jsonRpcRequest.method === 'initialize' && message.result?.protocolVersion) ||
                    message.result !== undefined ||
                    message.error !== undefined) {

                    client.onmessage = undefined; // 移除监听器

                    console.log("[MCP] Response:", JSON.stringify(message));

                    // 返回 SSE 格式以兼容现有前端
                    const sseResponse = `event: message\ndata: ${JSON.stringify(message)}\n\n`;

                    resolve(new Response(sseResponse, {
                        status: 200,
                        headers: {
                            "Content-Type": "text/event-stream",
                            "Cache-Control": "no-cache",
                            "Connection": "keep-alive",
                            "Mcp-Session-Id": "stateless-session",
                        },
                    }));
                }
            };

            client.onmessage = messageHandler;

            // 发送消息到服务器
            client.send(jsonRpcRequest).catch((error: Error) => {
                console.error("[MCP] Send Error:", error);
                resolve(new Response(
                    JSON.stringify({
                        jsonrpc: "2.0",
                        error: { code: -32603, message: error.message },
                        id: jsonRpcRequest.id || null,
                    }),
                    { status: 500, headers: { "Content-Type": "application/json" } }
                ));
            });

            // 超时处理
            setTimeout(() => {
                client.onmessage = undefined;
                resolve(new Response(
                    JSON.stringify({
                        jsonrpc: "2.0",
                        error: { code: -32603, message: "Request timeout" },
                        id: jsonRpcRequest.id || null,
                    }),
                    { status: 504, headers: { "Content-Type": "application/json" } }
                ));
            }, 30000);
        });

    } catch (error) {
        console.error("[MCP] Error:", error);
        return new Response(
            JSON.stringify({
                jsonrpc: "2.0",
                error: {
                    code: -32700,
                    message: error instanceof Error ? error.message : "Parse error",
                },
                id: null,
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
}
