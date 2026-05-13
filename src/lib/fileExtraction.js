import pdf from "pdf-parse/lib/pdf-parse.js";
import { getFileExtension, normalizeText } from "@/lib/helpers";

const PDF_TYPES = new Set(["application/pdf"]);
const TEXT_TYPES = new Set(["text/plain", "text/markdown", "text/csv"]);
const TEXT_EXTENSIONS = new Set(["txt", "md", "csv"]);

function cleanExtractedText(text) {
  return normalizeText(text)
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isPdf(file, extension) {
  return PDF_TYPES.has(file.type) || extension === "pdf";
}

function isText(file, extension) {
  return TEXT_TYPES.has(file.type) || TEXT_EXTENSIONS.has(extension);
}

export async function extractTextFromUpload(file, options = {}) {
  const maxChars = options.maxChars || 6000;
  const label = options.label || "document";

  if (!file || !file.name) {
    return {
      fileName: "",
      extractedText: "",
      summary: "",
    };
  }

  const extension = getFileExtension(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedText = "";

  if (isPdf(file, extension)) {
    const pdfData = await pdf(buffer);
    extractedText = cleanExtractedText(pdfData.text || "");
  } else if (isText(file, extension)) {
    extractedText = cleanExtractedText(new TextDecoder("utf-8", { fatal: false }).decode(buffer));
  } else {
    throw new Error(
      `Unsupported ${label} format for accurate extraction. Upload a text-based PDF or paste the content directly.`
    );
  }

  if (!extractedText || extractedText.length < 25) {
    throw new Error(
      `We could not extract enough readable text from this ${label}. Use a text-based PDF instead of a scanned image.`
    );
  }

  return {
    fileName: file.name,
    extractedText: extractedText.slice(0, maxChars),
    summary: `${label}: ${file.name} (${file.type || extension || "unknown"}, ${(file.size / 1024).toFixed(1)}KB)`,
  };
}
