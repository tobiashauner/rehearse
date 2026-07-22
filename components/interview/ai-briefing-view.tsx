import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  Map,
  MessageCircleQuestion,
  Scale,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProjectAnalysis } from "@/lib/prompts/project-analysis";

/*
 * The briefing as a three-chapter roadmap instead of a uniform card grid:
 * the room you're walking into (role + company) → where you stand (your
 * resume, read like an interviewer) → your preparation plan (focus areas,
 * stories, likely questions). A left spine connects the chapters; each
 * chapter is a native <details> so it collapses without any JS.
 */

export function AiBriefingView({ analysis }: { analysis: ProjectAnalysis }) {
  return (
    <div className="max-w-3xl">
      <Chapter
        icon={Building2}
        title="The room you're walking into"
        subtitle="What this role and company are really asking for."
      >
        <p className="max-w-prose leading-relaxed text-foreground/85">
          {analysis.roleSummary}
        </p>

        {analysis.companyCulture && (
          <Block label="How they work">
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {analysis.companyCulture}
            </p>
          </Block>
        )}

        {analysis.requiredSkills.length > 0 && (
          <Block label="Skills they'll expect">
            <ChipRow items={analysis.requiredSkills} />
          </Block>
        )}

        {analysis.leadershipSignals.length > 0 && (
          <Block label="Leadership signals they'll listen for">
            <IconList icon={Sparkles} items={analysis.leadershipSignals} />
          </Block>
        )}
      </Chapter>

      <Chapter
        icon={Scale}
        title="Where you stand"
        subtitle="Your resume, read the way an interviewer will read it."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Block label="Working in your favor">
            <IconList
              icon={Check}
              iconClass="text-badge-accent"
              items={analysis.resumeStrengths}
            />
          </Block>
          <Block label="Worth shoring up">
            <IconList
              icon={ArrowUpRight}
              iconClass="text-primary"
              items={analysis.resumeGaps}
            />
          </Block>
        </div>

        {analysis.potentialConcerns.length > 0 && (
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <MessageCircleQuestion className="size-4 text-badge-accent" />
              An interviewer might wonder…
            </p>
            <ul className="mt-2 space-y-1.5 pl-6 text-sm text-muted-foreground">
              {analysis.potentialConcerns.map((item, i) => (
                <li key={i} className="list-disc">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Chapter>

      <Chapter
        icon={Map}
        title="Your preparation plan"
        subtitle="What to expect, and the stories to have ready."
        last
      >
        {analysis.likelyInterviewFocus.length > 0 && (
          <Block label="The interview will likely focus on">
            <ChipRow items={analysis.likelyInterviewFocus} accent />
          </Block>
        )}

        {analysis.suggestedStories.length > 0 && (
          <Block label="Stories to have ready">
            <ol className="space-y-2">
              {analysis.suggestedStories.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 shrink-0 font-medium text-badge-accent tabular-nums">
                    {i + 1}.
                  </span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ol>
          </Block>
        )}

        {analysis.recommendedStarExamples.length > 0 && (
          <Block label="Shape these as STAR examples">
            <IconList icon={Sparkles} items={analysis.recommendedStarExamples} />
          </Block>
        )}

        {analysis.likelyQuestions.length > 0 && (
          <Block label="Questions to rehearse">
            <ol className="divide-y">
              {analysis.likelyQuestions.map((item, i) => (
                <li key={i} className="flex gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                  <span className="shrink-0 text-muted-foreground/70 tabular-nums">
                    Q{i + 1}
                  </span>
                  <span className="text-foreground/85">{item}</span>
                </li>
              ))}
            </ol>
          </Block>
        )}
      </Chapter>
    </div>
  );
}

function Chapter({
  icon: Icon,
  title,
  subtitle,
  last = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="relative pb-10 pl-12 last:pb-0 sm:pl-14">
      {!last && (
        <span
          aria-hidden
          className="absolute top-11 bottom-0 left-[17px] w-px bg-border sm:left-[19px]"
        />
      )}
      <span
        aria-hidden
        className="absolute top-0 left-0 flex size-9 items-center justify-center rounded-full bg-badge-accent text-badge-accent-foreground sm:size-10"
      >
        <Icon className="size-4 sm:size-[18px]" />
      </span>
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block text-lg leading-tight font-medium">
              {title}
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {subtitle}
            </span>
          </span>
          <ChevronDown className="mt-1 ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-5 space-y-6">{children}</div>
      </details>
    </section>
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function ChipRow({ items, accent = false }: { items: string[]; accent?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className={
            accent
              ? "rounded-lg bg-badge-accent/10 px-2.5 py-1 text-sm font-medium text-badge-accent"
              : "rounded-lg border px-2.5 py-1 text-sm text-foreground/80"
          }
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function IconList({
  icon: Icon,
  items,
  iconClass = "text-badge-accent",
}: {
  icon: LucideIcon;
  items: string[];
  iconClass?: string;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm">
          <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} />
          <span className="text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}
