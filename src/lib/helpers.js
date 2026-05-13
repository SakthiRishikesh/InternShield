const WHITESPACE_REGEX = /\s+/g;

export function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function normalizeText(value = "") {
  return value.replace(WHITESPACE_REGEX, " ").trim();
}

export function normalizeSearchText(value = "") {
  return normalizeText(value).toLowerCase();
}

export function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

export function getFileExtension(fileName = "") {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

export function formatFileSize(sizeInBytes = 0) {
  const sizeInMb = sizeInBytes / (1024 * 1024);
  return `${sizeInMb.toFixed(1)}MB`;
}

export function extractMatchedKeywords(source, keywords = []) {
  const haystack = normalizeSearchText(source);

  if (!haystack) {
    return [];
  }

  return keywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));
}
