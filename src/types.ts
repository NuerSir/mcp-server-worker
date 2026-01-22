export interface PagesEnv {
	API_KEY?: string;
	ASSETS?: Fetcher;
}

export type PagesHandler = (
	request: Request,
	env: PagesEnv,
	ctx: ExecutionContext,
) => Response | Promise<Response>;

export interface PagesExportedHandler {
	fetch?: PagesHandler;
}
