interface McpHttpClientOptions { endpoint: string; apiKey?: string; allowedTools: string[]; fetch: typeof fetch; }
interface McpRpcResponse { result?: unknown; error?: { message?: string }; }

export class McpHttpClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly allowedTools: Set<string>;
  private readonly fetcher: typeof fetch;
  private nextRequestId = 1;

  constructor(options: McpHttpClientOptions) {
    this.endpoint = options.endpoint.trim();
    this.apiKey = options.apiKey?.trim() ?? "";
    this.allowedTools = new Set(options.allowedTools);
    this.fetcher = options.fetch;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.endpoint) throw new Error("MCP endpoint is not configured");
    if (!this.allowedTools.has(name)) throw new Error(`MCP tool is not allowlisted: ${name}`);
    const response = await this.fetcher(this.endpoint, {
      method: "POST",
      headers: { accept: "application/json, text/event-stream", "content-type": "application/json", ...(this.apiKey ? { "x-api-key": this.apiKey } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: this.nextRequestId++, method: "tools/call", params: { name, arguments: args } }),
    });
    const body = (await response.json()) as McpRpcResponse;
    if (!response.ok || body.error) throw new Error(`MCP request failed (${response.status}): ${body.error?.message ?? "unknown upstream error"}`);
    return body.result;
  }
}
