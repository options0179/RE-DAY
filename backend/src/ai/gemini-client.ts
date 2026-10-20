interface GeminiClientOptions {
  apiKey: string;
  model: string;
  fetch: typeof fetch;
}

interface GenerateRequest {
  systemInstruction: string;
  userPrompt: string;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
}

export class GeminiClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetcher: typeof fetch;

  constructor(options: GeminiClientOptions) {
    this.apiKey = options.apiKey.trim();
    this.model = options.model.trim();
    this.fetcher = options.fetch;
  }

  async generate(request: GenerateRequest): Promise<string> {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY is required");
    if (!this.model) throw new Error("GEMINI_MODEL is required");

    const response = await this.fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: request.userPrompt }] }],
        }),
      },
    );

    const body = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status}): ${body.error?.message ?? "unknown upstream error"}`);
    }
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) throw new Error("Gemini response did not contain text");
    return text;
  }
}
