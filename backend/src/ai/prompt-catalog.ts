import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface AgentSkillPrompt { name: string; content: string; }
export interface AgentPrompts { mainInstructions: string; skills: AgentSkillPrompt[]; }

const moduleRoot = dirname(fileURLToPath(import.meta.url));

async function isDirectory(path: string) {
  try { await access(path); return true; } catch { return false; }
}

export class AgentPromptCatalog {
  private readonly configuredRoot?: string;

  constructor(configuredRoot?: string) {
    this.configuredRoot = configuredRoot;
  }

  async load(): Promise<AgentPrompts> {
    const root = await this.resolveRoot();
    const skillDir = join(root, "skills");
    const skillFiles = (await readdir(skillDir)).filter((file) => file.endsWith(".md")).sort();
    if (!skillFiles.length) throw new Error(`No Agent skill prompts found in ${skillDir}`);
    return {
      mainInstructions: await readFile(join(root, "main-instructions.md"), "utf8"),
      skills: await Promise.all(skillFiles.map(async (file) => ({ name: file.slice(0, -3), content: await readFile(join(skillDir, file), "utf8") }))),
    };
  }

  private async resolveRoot() {
    const candidates = this.configuredRoot
      ? [this.configuredRoot]
      : [
          process.env.REDAY_AGENT_DOCS_DIR,
          resolve(process.cwd(), "docs/agent"),
          resolve(process.cwd(), "../docs/agent"),
          resolve(moduleRoot, "../../../../docs/agent"),
        ].filter((candidate): candidate is string => Boolean(candidate));
    for (const candidate of candidates) {
      if (await isDirectory(join(candidate, "skills"))) return candidate;
    }
    throw new Error(`Agent prompt directory not found. Checked: ${candidates.join(", ")}`);
  }
}
