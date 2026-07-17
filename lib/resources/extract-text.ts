import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

const MAX_EXTRACTED_CHARS = 50_000;

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TXT_MIME = "text/plain";

/**
 * Best-effort MIME type from a filename, for cases where a stored file's own
 * content-type isn't reliably available (e.g. re-extracting from storage).
 */
export function mimeTypeFromName(name: string): string | null {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "pdf") return PDF_MIME;
  if (ext === "docx") return DOCX_MIME;
  if (ext === "txt") return TXT_MIME;
  return null;
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string | null,
): Promise<string | null> {
  try {
    let text: string;

    if (mimeType === PDF_MIME) {
      const doc = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(doc, { mergePages: true });
      text = result.text;
    } else if (mimeType === DOCX_MIME) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (mimeType === TXT_MIME) {
      text = buffer.toString("utf-8");
    } else {
      return null;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed.slice(0, MAX_EXTRACTED_CHARS);
  } catch (err) {
    console.error("extractTextFromBuffer failed", err);
    return null;
  }
}

export async function extractFileText(file: File): Promise<string | null> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || mimeTypeFromName(file.name);
  return extractTextFromBuffer(buffer, mimeType);
}
