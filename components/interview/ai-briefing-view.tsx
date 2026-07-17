import type { ProjectAnalysis } from "@/lib/prompts/project-analysis";

const SECTIONS: {
  key: keyof ProjectAnalysis;
  label: string;
  kind: "text" | "list";
}[] = [
  { key: "roleSummary", label: "Role Summary", kind: "text" },
  { key: "requiredSkills", label: "Required Skills", kind: "list" },
  { key: "leadershipSignals", label: "Leadership Signals", kind: "list" },
  { key: "companyCulture", label: "Company Culture", kind: "text" },
  { key: "likelyInterviewFocus", label: "Likely Interview Focus", kind: "list" },
  { key: "resumeStrengths", label: "Resume Strengths", kind: "list" },
  { key: "resumeGaps", label: "Resume Gaps", kind: "list" },
  { key: "potentialConcerns", label: "Potential Concerns", kind: "list" },
  { key: "suggestedStories", label: "Suggested Stories", kind: "list" },
  {
    key: "recommendedStarExamples",
    label: "Recommended STAR Examples",
    kind: "list",
  },
  { key: "likelyQuestions", label: "Likely Questions", kind: "list" },
];

export function AiBriefingView({ analysis }: { analysis: ProjectAnalysis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SECTIONS.map((section) => {
        const value = analysis[section.key];
        return (
          <div key={section.key} className="space-y-1.5 rounded-lg border p-4">
            <h3 className="text-sm font-medium">{section.label}</h3>
            {section.kind === "text" ? (
              <p className="text-sm text-muted-foreground">{value as string}</p>
            ) : (
              <ul className="list-disc space-y-0.5 pl-4 text-sm text-muted-foreground">
                {(value as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
