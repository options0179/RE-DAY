import { AgentPromptCatalog, type AgentPrompts } from "./prompt-catalog.ts";

interface GenerateRequest { systemInstruction: string; userPrompt: string; }
interface AgentOrchestratorOptions { promptCatalog?: { load(): Promise<AgentPrompts> }; generate(request: GenerateRequest): Promise<string>; }

export interface AnalyzeResponseRequest { jobName: string; incident: string; responseText: string; }
export interface ResponseAnalysis {
  behaviorTags: string[]; immediateEffect: string; delayedEffect: string | null;
  relationshipChange: number; taskChange: number; evidence: string;
}
export interface Consequence {
  characterReaction: string; timeConsumedMinutes: number; carryOverIssueIds: string[]; slotComplete: boolean;
}
export interface AgentSceneResult { skillCalls: string[]; analysis: ResponseAnalysis; consequence: Consequence; promptVersion: "gemini-agent-v1"; }

export class AgentOrchestrator {
  private readonly promptCatalog: { load(): Promise<AgentPrompts> };
  private readonly generate: (request: GenerateRequest) => Promise<string>;

  constructor(options: AgentOrchestratorOptions) {
    this.promptCatalog = options.promptCatalog ?? new AgentPromptCatalog();
    this.generate = options.generate;
  }

  async analyzeResponse(request: AnalyzeResponseRequest): Promise<AgentSceneResult> {
    const prompts = await this.promptCatalog.load();
    const allowedSkills = new Set(prompts.skills.map((skill) => skill.name));
    const rawResult = await this.generate({
      systemInstruction: buildAgentSystemInstruction(prompts),
      userPrompt: [`직무: ${request.jobName}`, `현재 사건: ${request.incident}`, `사용자 응답: ${request.responseText}`].join("\n"),
    });
    return { ...parseAgentResult(rawResult, allowedSkills), promptVersion: "gemini-agent-v1" };
  }
}

export function buildAgentSystemInstruction(prompts: AgentPrompts) {
  return [
    prompts.mainInstructions,
    "\n## 추출된 Skill 안내",
    ...prompts.skills.map((skill) => `\n### Skill: ${skill.name}\n${skill.content}`),
    "\n## 출력 계약",
    "JSON object만 반환한다. skillCalls는 사용한 Skill 파일명 배열이다. analysis와 consequence는 제공된 구조를 정확히 따른다.",
    'analysis: { behaviorTags: string[], immediateEffect: string, delayedEffect: string | null, relationshipChange: number, taskChange: number, evidence: string }',
    'consequence: { characterReaction: string, timeConsumedMinutes: number, carryOverIssueIds: string[], slotComplete: boolean }',
  ].join("\n");
}

function parseAgentResult(raw: string, allowedSkills: Set<string>): Omit<AgentSceneResult, "promptVersion"> {
  let value: unknown;
  try { value = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim()); } catch { throw new Error("invalid Agent result: expected JSON"); }
  if (!isRecord(value) || !Array.isArray(value.skillCalls) || !value.skillCalls.every((skill) => typeof skill === "string")) throw new Error("invalid Agent result: skillCalls is required");
  const skillCalls = value.skillCalls as string[];
  const unknownSkill = skillCalls.find((skill) => !allowedSkills.has(skill));
  if (unknownSkill) throw new Error(`unknown skill: ${unknownSkill}`);
  if (!isResponseAnalysis(value.analysis) || !isConsequence(value.consequence)) throw new Error("invalid Agent result: analysis and consequence are required");
  return { skillCalls, analysis: value.analysis, consequence: value.consequence };
}

function isResponseAnalysis(value: unknown): value is ResponseAnalysis {
  return isRecord(value) && Array.isArray(value.behaviorTags) && value.behaviorTags.every((tag) => typeof tag === "string") && typeof value.immediateEffect === "string" && (value.delayedEffect === null || typeof value.delayedEffect === "string") && typeof value.relationshipChange === "number" && Number.isFinite(value.relationshipChange) && typeof value.taskChange === "number" && Number.isFinite(value.taskChange) && typeof value.evidence === "string";
}

function isConsequence(value: unknown): value is Consequence {
  return isRecord(value) && typeof value.characterReaction === "string" && typeof value.timeConsumedMinutes === "number" && Number.isInteger(value.timeConsumedMinutes) && value.timeConsumedMinutes >= 0 && Array.isArray(value.carryOverIssueIds) && value.carryOverIssueIds.every((id) => typeof id === "string") && typeof value.slotComplete === "boolean";
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
