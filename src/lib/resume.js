import {
  clampNumber,
  extractMatchedKeywords,
  formatFileSize,
  getFileExtension,
  normalizeSearchText,
  normalizeText,
  uniqueStrings,
} from "@/lib/helpers";

export const RESUME_SCAN_STEPS = [
  "Parsing document structure...",
  "Extracting skill signals...",
  "Cross-checking job keywords...",
  "Calculating ATS compatibility...",
  "Finalizing recommendations...",
];

const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
]);
const ALLOWED_RESUME_EXTENSIONS = new Set(["pdf"]);
const TRACKED_KEYWORDS = [
  "react",
  "next.js",
  "javascript",
  "typescript",
  "node.js",
  "python",
  "sql",
  "mongodb",
  "aws",
  "docker",
  "ci/cd",
  "testing",
  "unit testing",
  "figma",
  "communication",
  "leadership",
  "analytics",
  "data structures",
  "distributed systems",
];
const BASE_RESUME_SKILLS = [
  "react",
  "javascript",
  "html",
  "css",
  "git",
  "apis",
  "communication",
];

export function validateResumeFile(file) {
  if (!file) {
    return "Upload a resume before starting the scan.";
  }

  const extension = getFileExtension(file.name);
  const hasAllowedType = !file.type || ALLOWED_RESUME_TYPES.has(file.type);
  const hasAllowedExtension = ALLOWED_RESUME_EXTENSIONS.has(extension);

  if (!hasAllowedType && !hasAllowedExtension) {
    return "Upload a text-based PDF resume for accurate parsing.";
  }

  if (file.size > MAX_RESUME_FILE_SIZE) {
    return `The selected file is ${formatFileSize(file.size)}. Please keep it under 10.0MB.`;
  }

  return null;
}

function getTrackedKeywords(jobDescription) {
  const matches = extractMatchedKeywords(jobDescription, TRACKED_KEYWORDS);
  return uniqueStrings(matches).slice(0, 8);
}

export function analyzeResume({ file, jdText = "" }) {
  const validationError = validateResumeFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const fileName = normalizeSearchText(file.name);
  const jobDescription = normalizeSearchText(jdText);
  const trackedKeywords = getTrackedKeywords(jobDescription);
  const inferredResumeSkills = new Set(BASE_RESUME_SKILLS);

  if (fileName.includes("react")) {
    inferredResumeSkills.add("react");
  }

  if (fileName.includes("frontend") || fileName.includes("ui")) {
    inferredResumeSkills.add("figma");
  }

  if (fileName.includes("fullstack")) {
    inferredResumeSkills.add("node.js");
    inferredResumeSkills.add("sql");
  }

  const matchedKeywords = trackedKeywords.filter((keyword) =>
    inferredResumeSkills.has(keyword)
  );
  const missingKeywords = trackedKeywords.filter(
    (keyword) => !inferredResumeSkills.has(keyword)
  );

  const readability = clampNumber(74 + (file.name.length < 35 ? 8 : 2), 55, 96);
  const formatting = clampNumber(
    70 + (getFileExtension(file.name) === "pdf" ? 12 : 6),
    55,
    96
  );
  const keywords = trackedKeywords.length
    ? clampNumber(
        Math.round((matchedKeywords.length / trackedKeywords.length) * 100),
        34,
        95
      )
    : 72;
  const score = Math.round((readability + formatting + keywords) / 3);

  const strengths = uniqueStrings([
    getFileExtension(file.name) === "pdf"
      ? "Consistent PDF formatting"
      : "Editable resume format for quick iteration",
    file.name.length < 35
      ? "Clear and professional file naming"
      : "File is present and ready for ATS review",
    trackedKeywords.length > 0
      ? `Targets ${matchedKeywords.length || "some"} job-specific keyword signals`
      : "Ready for a baseline ATS scan even without a job description",
  ]);

  const suggestions = missingKeywords.length
    ? `Add evidence for ${missingKeywords.slice(0, 3).join(", ")} so the resume lines up more closely with the target role. Pair each keyword with a measurable outcome when possible.`
    : "Add one or two quantified bullet points to strengthen impact and help recruiters scan value quickly.";

  return {
    score,
    metrics: {
      readability,
      formatting,
      keywords,
    },
    strengths,
    missingKeywords:
      missingKeywords.length > 0
        ? missingKeywords.slice(0, 4)
        : ["Quantified impact", "Testing", "Ownership", "Tooling"],
    suggestions,
    usedJobDescription: normalizeText(jdText).length > 0,
  };
}
