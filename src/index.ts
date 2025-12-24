import app from "./app";
import { handleMcpRequest } from "./server";

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
            const apiKey = env.API_KEY;

            if (apiKey) {
                const authHeader = request.headers.get("Authorization");
                const urlApiKey = url.searchParams.get("apiKey");

                if ((!authHeader || authHeader !== `Bearer ${apiKey}`) && urlApiKey !== apiKey) {
                    return new Response("Unauthorized", { status: 401 });
                }
            }

            // Create a new request with cleaned URL
            const newUrl = new URL(request.url);
            newUrl.searchParams.delete("apiKey");
            const newRequest = new Request(newUrl.toString(), request);

            try {
                console.log(`[MCP] ${newRequest.method} ${newRequest.url}`);
                return await handleMcpRequest(newRequest);
            } catch (e) {
                console.error("MCP Handler Error:", e);
                return new Response("Internal Server Error", { status: 500 });
            }
        }

        return new Response("Not Found", { status: 404 });
    }
};
