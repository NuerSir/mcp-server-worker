import { Hono } from "hono";
import {
	layout,
	dashboard,
} from "./utils";
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
	// Pass the tools to the dashboard component
	const content = dashboard(tools);
	return c.html(layout(content, "Worker MCP - Command Center"));
});

export default app;
