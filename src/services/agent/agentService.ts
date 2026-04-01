import { GoogleGenAI } from "@google/genai";
import { SKILLS_REGISTRY } from "../../constants";

export interface AgentConfig {
  model: string;
  systemInstruction: string;
  skills?: string[];
}

const augmentSystemInstructionWithSkills = (base: string, skillIds?: string[]): string => {
  const ids = skillIds?.filter(Boolean) ?? [];
  if (ids.length === 0) return base;

  const lines = ids
    .map((id) => SKILLS_REGISTRY.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => `- ${s.id} (${s.name}): ${s.description}`);

  if (lines.length === 0) {
    return `${base}\n\n[할당된 스킬 id: ${ids.join(", ")} — SKILLS_REGISTRY에 설명이 없습니다.]`;
  }

  return `${base}\n\n[워크플로 스킬 — 응답·톤·금지 사항에 맞게 반영하세요]\n${lines.join("\n")}`;
};

export class Agent {
  private ai: GoogleGenAI;
  private config: AgentConfig;

  constructor(apiKey: string, config: AgentConfig) {
    this.ai = new GoogleGenAI({ apiKey });
    this.config = config;
  }

  async execute(input: string): Promise<string> {
    const systemInstruction = augmentSystemInstructionWithSkills(
      this.config.systemInstruction,
      this.config.skills,
    );

    const response = await this.ai.models.generateContent({
      model: this.config.model,
      contents: [{ parts: [{ text: input }] }],
      config: {
        systemInstruction,
      },
    });

    return response.text || "";
  }
}
