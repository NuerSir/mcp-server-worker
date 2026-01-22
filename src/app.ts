import { Hono } from "hono";
import { layout, dashboard } from "./utils";
import { toolRegistry } from "./utils/tools";

export type Bindings = Env;

const app = new Hono<{
	Bindings: Bindings;
}>();

// Render the modern dashboard
app.get("/", async (c) => {
	// Register tools if not already registered (or just register anyway as it's idempotent-ish)
	const { registerAllTools } = await import("./tools");
	registerAllTools();

	const tools = toolRegistry.getAllTools();
	// Convert Zod schemas to JSON Schema for the frontend
	const { zodToJsonSchema } = await import("zod-to-json-schema");
	const { z } = await import("zod");

	const serializableTools = tools.map((t) => ({
		...t,
		schema: zodToJsonSchema(z.object(t.schema)),
	}));

	// Pass the tools to the dashboard component
	const content = dashboard(serializableTools as any);
	return c.html(layout(content, "Worker MCP - Command Center"));
});

export default app;
