import { z } from "zod";
import type OpenAI from "openai";

export const projectAnalysisSchema = z.object({
  roleSummary: z.string(),
  requiredSkills: z.array(z.string()),
  leadershipSignals: z.array(z.string()),
  companyCulture: z.string(),
  likelyInterviewFocus: z.array(z.string()),
  resumeStrengths: z.array(z.string()),
  resumeGaps: z.array(z.string()),
  potentialConcerns: z.array(z.string()),
  suggestedStories: z.array(z.string()),
  recommendedStarExamples: z.array(z.string()),
  likelyQuestions: z.array(z.string()),
});

export type ProjectAnalysis = z.infer<typeof projectAnalysisSchema>;

type ProjectAnalysisInput = {
  project: { title: string; company: string | null; role: string | null };
  resources: {
    type: string;
    name: string | null;
    content: string | null;
    url: string | null;
  }[];
};

export function buildProjectAnalysisMessages({
  project,
  resources,
}: ProjectAnalysisInput): OpenAI.ChatCompletionMessageParam[] {
  const resourceBlocks = resources.length
    ? resources
        .map((resource, index) => {
          const label = resource.name || resource.type;
          const parts = [`Resource ${index + 1}: ${resource.type} — ${label}`];
          if (resource.url) parts.push(`URL: ${resource.url}`);
          parts.push(resource.content ? resource.content : "(no text content provided)");
          return parts.join("\n");
        })
        .join("\n\n---\n\n")
    : "(no resources uploaded yet)";

  return [
    {
      role: "system",
      content:
        "You are an expert interview coach analyzing a candidate's job application " +
        "materials to prepare them for a realistic mock interview. Be specific and " +
        "grounded in the provided materials — never invent facts not supported by them.",
    },
    {
      role: "user",
      content:
        `Project: ${project.title}` +
        (project.role ? ` — ${project.role}` : "") +
        (project.company ? ` @ ${project.company}` : "") +
        `\n\nResources:\n\n${resourceBlocks}\n\n` +
        "Analyze this project and produce a structured briefing covering: a role " +
        "summary, required skills, leadership signals expected of the role, company " +
        "culture, the likely interview focus areas, the candidate's resume strengths " +
        "and gaps relative to the role, potential concerns an interviewer might have, " +
        "suggested stories the candidate could tell, recommended STAR-format examples " +
        "to prepare, and likely interview questions.",
    },
  ];
}
