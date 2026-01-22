import app from "../src/app";
import { handleMcpRequest } from "../src/server";

export default {
	async fetch(request: Request, env: any, ctx: any): Promise<Response> {
		const url = new URL(request.url);

		try {
			if (url.pathname === "/" || url.pathname === "/index.html") {
				return app.fetch(request, env as any, ctx);
			}

			if (url.pathname === "/mcp") {
				const apiKey = (env as any).API_KEY;

				if (apiKey) {
					const authHeader = request.headers.get("Authorization");
					const urlApiKey = url.searchParams.get("apiKey");

					if ((!authHeader || authHeader !== `Bearer ${apiKey}`) && urlApiKey !== apiKey) {
						return new Response("Unauthorized", { status: 401 });
					}
				}

				const newUrl = new URL(request.url);
				newUrl.searchParams.delete("apiKey");
				const newRequest = new Request(newUrl.toString(), request);

				console.log(`[MCP] ${newRequest.method} ${newRequest.url}`);
				return await handleMcpRequest(newRequest);
			}

			return new Response("Not Found", { status: 404 });
		} catch (e) {
			console.error("Pages Handler Error:", e);
			return new Response("Internal Server Error", { status: 500 });
		}
	},
};
