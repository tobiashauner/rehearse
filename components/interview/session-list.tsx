import Link from "next/link";
import { Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  PERSONALITY_OPTIONS,
  optionLabel,
} from "@/lib/validations/session";
import type { Database } from "@/types/database";

type Session = Pick<
  Database["public"]["Tables"]["interview_sessions"]["Row"],
  | "id"
  | "status"
  | "interview_type"
  | "difficulty"
  | "interviewer_personality"
  | "length_minutes"
  | "created_at"
>;

export function SessionList({
  projectId,
  sessions,
}: {
  projectId: string;
  sessions: Session[];
}) {
  if (sessions.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Mic />
          </EmptyMedia>
          <EmptyTitle>No interviews yet</EmptyTitle>
          <EmptyDescription>Configure one to get started.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ItemGroup className="gap-0 divide-y divide-border rounded-lg border">
      {sessions.map((session) => (
        <Item
          key={session.id}
          className="rounded-none border-none"
          render={<Link href={`/projects/${projectId}/sessions/${session.id}`} />}
        >
          <ItemMedia variant="icon">
            <Mic />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              <span>{optionLabel(INTERVIEW_TYPE_OPTIONS, session.interview_type)}</span>
              <Badge variant="accent">
                {optionLabel(DIFFICULTY_OPTIONS, session.difficulty)}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {session.status}
              </Badge>
            </ItemTitle>
            <ItemDescription>
              {optionLabel(PERSONALITY_OPTIONS, session.interviewer_personality)}{" "}
              interviewer · {session.length_minutes} min · Added{" "}
              {new Date(session.created_at).toLocaleDateString()}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}
