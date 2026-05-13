import {
  clampNumber,
  extractMatchedKeywords,
  formatFileSize,
  getFileExtension,
  normalizeSearchText,
  normalizeText,
  uniqueStrings,
} from "@/lib/helpers";

const MAX_VERIFICATION_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_VERIFICATION_TYPES = new Set([
  "application/pdf",
]);
const ALLOWED_VERIFICATION_EXTENSIONS = new Set(["pdf"]);

const RISK_RULES = [
  {
    keywords: ["deposit", "security deposit", "registration fee", "processing fee"],
    allowNegation: true,
    penalty: 24,
    factor: "The offer mentions an upfront payment before onboarding.",
    review: "Applicants flagged payment requests before equipment or contracts were shared.",
    sentiment: "danger",
  },
  {
    keywords: ["telegram", "whatsapp only", "gmail.com", "yahoo.com", "outlook.com"],
    penalty: 18,
    factor: "The recruiter channel looks informal or detached from a company domain.",
    review: "The contact method looked personal rather than company-owned.",
    sentiment: "warning",
  },
  {
    keywords: ["urgent", "immediately", "today only", "limited seats", "act now"],
    penalty: 12,
    factor: "The language pushes urgency instead of normal interview steps.",
    review: "The offer used pressure tactics to rush a decision.",
    sentiment: "warning",
  },
  {
    keywords: ["no interview", "instant offer", "guaranteed placement", "guaranteed internship"],
    penalty: 20,
    factor: "The process skips normal screening or promises guaranteed placement.",
    review: "The hiring flow sounded too frictionless for a legitimate internship.",
    sentiment: "danger",
  },
  {
    keywords: ["crypto", "wallet", "gift card", "bank transfer"],
    allowNegation: true,
    penalty: 26,
    factor: "The offer references unusual payment methods.",
    review: "Community reports often treat non-standard payment instructions as a major red flag.",
    sentiment: "danger",
  },
];

const TRUST_RULES = [
  {
    keywords: ["official website", "company domain", "careers page", "linkedin company page"],
    bonus: 8,
    note: "The details reference a company-owned presence that can be independently checked.",
    review: "There are clear public breadcrumbs to validate the employer.",
    sentiment: "positive",
  },
  {
    keywords: ["interview", "assessment", "offer letter", "mentor", "stipend"],
    allowNegation: true,
    bonus: 6,
    note: "The flow includes normal internship steps and deliverables.",
    review: "The process description resembles a standard recruiting workflow.",
    sentiment: "positive",
  },
  {
    keywords: ["university", ".edu", "campus drive", "referral"],
    bonus: 5,
    note: "The source appears tied to a recognisable institutional or referral channel.",
    review: "The opportunity comes through a channel that is easier to cross-check.",
    sentiment: "positive",
  },
];

function getToneFromScore(score) {
  if (score < 45) {
    return { status: "Suspicious", tone: "danger" };
  }

  if (score < 70) {
    return { status: "Needs Review", tone: "warning" };
  }

  return { status: "Likely Safe", tone: "success" };
}

function buildReason(riskMatches, trustMatches, limitedEvidence) {
  if (riskMatches.length > 0) {
    return `We found ${riskMatches.length} meaningful risk signal${riskMatches.length === 1 ? "" : "s"} in the supplied details, so this offer should be verified manually before you reply.`;
  }

  if (limitedEvidence) {
    return "The scan did not receive enough detail to confirm the offer, so this verdict is based on limited evidence and should be treated cautiously.";
  }

  if (trustMatches.length > 0) {
    return "The details look reasonably consistent with a normal internship flow, although you should still verify the recruiter identity and company page.";
  }

  return "The signals are mixed, so double-check the recruiter, domain, and interview process before moving forward.";
}

function buildCommunitySignals(riskMatches, trustMatches, limitedEvidence) {
  const baseSignals = [];

  riskMatches.forEach((match, index) => {
    baseSignals.push({
      id: `risk-${index + 1}`,
      source: "Community note",
      content: match.review,
      sentiment: match.sentiment,
    });
  });

  trustMatches.slice(0, 2).forEach((match, index) => {
    baseSignals.push({
      id: `trust-${index + 1}`,
      source: "Cross-check",
      content: match.review,
      sentiment: match.sentiment,
    });
  });

  if (baseSignals.length === 0) {
    baseSignals.push({
      id: "limited-evidence",
      source: "Coverage gap",
      content: limitedEvidence
        ? "There is not enough employer detail here to make a high-confidence call."
        : "No obvious community-style red flags surfaced from the provided text alone.",
      sentiment: limitedEvidence ? "warning" : "positive",
    });
  }

  return baseSignals.slice(0, 3);
}

function isNegatedOccurrence(source, keyword) {
  const haystack = normalizeSearchText(source);
  const needle = keyword.toLowerCase();
  let index = haystack.indexOf(needle);

  while (index !== -1) {
    const before = haystack.slice(Math.max(0, index - 45), index);
    const after = haystack.slice(index + needle.length, index + needle.length + 35);
    const context = `${before}${needle}${after}`;

    if (
      /\b(no|not|never|without)\b[\w\s,.-]{0,35}$/.test(before) ||
      /\b(does not|doesn't|do not|don't|will not|won't)\b[\w\s,.-]{0,35}$/.test(before) ||
      /\b(not required|required|needed|asked|charged|collected)\b/.test(after) ||
      /\bno payment\b/.test(context) ||
      /\bno fee\b/.test(context)
    ) {
      return true;
    }

    index = haystack.indexOf(needle, index + needle.length);
  }

  return false;
}

function hasActionableRiskSignal(source, rule) {
  const matches = extractMatchedKeywords(source, rule.keywords);

  if (!matches.length) {
    return false;
  }

  if (!rule.allowNegation) {
    return true;
  }

  return matches.some((keyword) => !isNegatedOccurrence(source, keyword));
}

function hasActionableTrustSignal(source, rule) {
  const matches = extractMatchedKeywords(source, rule.keywords);

  if (!matches.length) {
    return false;
  }

  if (!rule.allowNegation) {
    return true;
  }

  return matches.some((keyword) => !isNegatedOccurrence(source, keyword));
}

export function validateVerificationFile(file) {
  if (!file) {
    return null;
  }

  const extension = getFileExtension(file.name);
  const hasAllowedType = !file.type || ALLOWED_VERIFICATION_TYPES.has(file.type);
  const hasAllowedExtension = ALLOWED_VERIFICATION_EXTENSIONS.has(extension);

  if (!hasAllowedType && !hasAllowedExtension) {
    return "Upload a text-based PDF file, or paste the offer details directly.";
  }

  if (file.size > MAX_VERIFICATION_FILE_SIZE) {
    return `The selected file is ${formatFileSize(file.size)}. Please keep it under 5.0MB.`;
  }

  return null;
}

export function verifyInternship({ text = "", file = null }) {
  const normalizedText = normalizeText(text);
  const fileDescriptor = normalizeText(
    [file?.name, file?.type, file ? formatFileSize(file.size) : ""].filter(Boolean).join(" ")
  );
  const combinedSource = normalizeSearchText(
    [normalizedText, fileDescriptor].filter(Boolean).join(" ")
  );

  if (!combinedSource) {
    throw new Error("Provide details or upload a file to scan.");
  }

  const riskMatches = RISK_RULES.filter((rule) =>
    hasActionableRiskSignal(combinedSource, rule)
  );
  const trustMatches = TRUST_RULES.filter((rule) =>
    hasActionableTrustSignal(combinedSource, rule)
  );

  const riskPenalty = riskMatches.reduce((total, rule) => total + rule.penalty, 0);
  const trustBonus = trustMatches.reduce((total, rule) => total + rule.bonus, 0);
  const limitedEvidence = normalizedText.length < 40 && !file;

  let score = 74 - riskPenalty + trustBonus;

  if (limitedEvidence) {
    score -= 10;
  }

  if (file && file.size > 0) {
    score += 4;
  }

  score = clampNumber(Math.round(score), 8, 96);

  const { status, tone } = getToneFromScore(score);
  const factors = uniqueStrings([
    ...riskMatches.map((rule) => rule.factor),
    ...trustMatches.map((rule) => rule.note),
    limitedEvidence
      ? "The scan has limited context because only a very small amount of detail was supplied."
      : "",
  ]);

  return {
    status,
    tone,
    score,
    reason: buildReason(riskMatches, trustMatches, limitedEvidence),
    factors:
      factors.length > 0
        ? factors
        : ["No strong positive or negative signal was found in the provided details."],
    reviews: buildCommunitySignals(riskMatches, trustMatches, limitedEvidence),
  };
}
