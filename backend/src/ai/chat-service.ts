import { buildAgentSystemInstruction } from "./agent-orchestrator.ts";
import type { AgentPrompts } from "./prompt-catalog.ts";

interface ChatServiceOptions {
  promptCatalog: { load(): Promise<AgentPrompts> };
  generate(request: { systemInstruction: string; userPrompt: string }): Promise<string>;
}

export class AgentChatService {
  private readonly options: ChatServiceOptions;

  constructor(options: ChatServiceOptions) {
    this.options = options;
  }

  async respond(message: string): Promise<string> {
    const userPrompt = message.trim();
    if (!userPrompt) throw new Error("message is required");
    const prompts = await this.options.promptCatalog.load();
    return this.options.generate({
      systemInstruction: `${buildAgentSystemInstruction(prompts)}\n\n## 대화 응답 규칙\n사용자의 선택을 대신 결정하지 말고, RE:DAY의 안전한 직무 탐색 흐름으로 답한다.`,
      userPrompt,
    });
  }
}
