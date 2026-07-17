import { z } from "zod";

export const FILE_RESOURCE_TYPES = [
  "resume",
  "cover_letter",
  "portfolio_pdf",
  "other_pdf",
] as const;

export const TEXT_RESOURCE_TYPES = ["personal_notes"] as const;

export const URL_RESOURCE_TYPES = [
  "linkedin_url",
  "company_website",
  "hiring_manager_linkedin",
] as const;

export const TEXT_OR_URL_RESOURCE_TYPES = ["job_description"] as const;

export const RESOURCE_TYPE_OPTIONS: {
  value: string;
  label: string;
  kind: "file" | "text" | "url" | "text_or_url";
}[] = [
  { value: "resume", label: "Resume", kind: "file" },
  { value: "cover_letter", label: "Cover Letter", kind: "file" },
  { value: "portfolio_pdf", label: "Portfolio PDF", kind: "file" },
  { value: "other_pdf", label: "Other PDF", kind: "file" },
  { value: "job_description", label: "Job Description", kind: "text_or_url" },
  { value: "personal_notes", label: "Personal Notes", kind: "text" },
  { value: "linkedin_url", label: "LinkedIn URL", kind: "url" },
  { value: "company_website", label: "Company Website", kind: "url" },
  {
    value: "hiring_manager_linkedin",
    label: "Hiring Manager LinkedIn",
    kind: "url",
  },
];

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_LABEL = "10MB";
export const ACCEPTED_FILE_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
export const ACCEPTED_FILE_LABEL = "PDF, DOCX, or TXT";

export const fileResourceSchema = z.object({
  type: z.enum(FILE_RESOURCE_TYPES),
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "File is required")
    .refine(
      (file) => file.size <= MAX_FILE_BYTES,
      `File must be ${MAX_FILE_LABEL} or smaller`,
    )
    .refine(
      (file) => ACCEPTED_FILE_MIME_TYPES.includes(file.type),
      `File must be ${ACCEPTED_FILE_LABEL}`,
    ),
});

export const textResourceSchema = z.object({
  type: z.enum(TEXT_RESOURCE_TYPES),
  name: z.string().optional(),
  content: z.string().min(1, "Content is required"),
});

export const urlResourceSchema = z.object({
  type: z.enum(URL_RESOURCE_TYPES),
  url: z.string().url("Enter a valid URL"),
  content: z.string().optional(),
});

export const textOrUrlResourceSchema = z
  .object({
    type: z.enum(TEXT_OR_URL_RESOURCE_TYPES),
    name: z.string().optional(),
    url: z.union([z.string().url("Enter a valid URL"), z.literal("")]).optional(),
    content: z.string().optional(),
  })
  .refine((data) => Boolean(data.url) || Boolean(data.content), {
    message: "Add a URL or paste the text",
    path: ["content"],
  });

export type FileResourceValues = z.infer<typeof fileResourceSchema>;
export type TextResourceValues = z.infer<typeof textResourceSchema>;
export type UrlResourceValues = z.infer<typeof urlResourceSchema>;
export type TextOrUrlResourceValues = z.infer<typeof textOrUrlResourceSchema>;
