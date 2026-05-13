import { askGemini, GEMINI_MODEL } from "@/lib/gemini";
import { verifyInternship } from "@/lib/verification";
import { fetchCommunitySignals } from "@/lib/rapidapi";

export const VERIFICATION_SYSTEM_PROMPT = `You are an expert internship scam detection system. Analyze the provided internship offer details and determine if it is legitimate, suspicious, or a scam.

Return a JSON object with exactly these fields:
- score: number 0-100 (0 = definite scam, 100 = fully safe)
- status: one of "Suspicious", "Needs Review", or "Likely Safe"
- tone: one of "danger", "warning", or "success"
- reason: a 1-2 sentence explanation of your verdict
- factors: array of 3-5 specific risk or trust signals found in the text
- reviews: array of 2-3 objects, each with:
  - source: string (e.g. "Pattern Analysis", "Community Signal", "Domain Check")
  - content: string (1 sentence insight)
  - sentiment: one of "danger", "warning", or "positive"

Base the analysis on common scam patterns: upfront payments, informal channels, urgency tactics, no interview process, suspicious payment methods, vague company details, unrealistic compensation, and unverifiable recruiter identity.`;

export const RESUME_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the resume details provided and assess its ATS compatibility.

Return a JSON object with exactly these fields:
- score: overall ATS compatibility score 0-100
- metrics: object with three sub-scores (each 0-100):
  - readability: how clear and well-structured the resume content is
  - formatting: quality of formatting, file type advantage, section organization
  - keywords: how well skills/keywords match the job description (if provided)
- strengths: array of 3 specific positive points about the resume
- missingKeywords: array of 3-5 skills or keywords the resume should add
- suggestions: a 2-3 sentence actionable recommendation to improve ATS score

If a job description is provided, heavily weight keyword matching. If not, give general ATS best-practice feedback.`;

const VERIFICATION_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    score: { type: "NUMBER" },
    status: { type: "STRING", enum: ["Suspicious", "Needs Review", "Likely Safe"] },
    tone: { type: "STRING", enum: ["danger", "warning", "success"] },
    reason: { type: "STRING" },
    factors: { type: "ARRAY", items: { type: "STRING" } },
    reviews: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          source: { type: "STRING" },
          content: { type: "STRING" },
          sentiment: { type: "STRING", enum: ["danger", "warning", "positive"] },
        },
        required: ["source", "content", "sentiment"],
      },
    },
  },
  required: ["score", "status", "tone", "reason", "factors", "reviews"],
};

const RESUME_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    score: { type: "NUMBER" },
    metrics: {
      type: "OBJECT",
      properties: {
        readability: { type: "NUMBER" },
        formatting: { type: "NUMBER" },
        keywords: { type: "NUMBER" },
      },
      required: ["readability", "formatting", "keywords"],
    },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    missingKeywords: { type: "ARRAY", items: { type: "STRING" } },
    suggestions: { type: "STRING" },
  },
  required: ["score", "metrics", "strengths", "missingKeywords", "suggestions"],
};

function clampScore(value, fallback) {
  const numeric = Number(value);
  return Math.min(100, Math.max(0, Number.isFinite(numeric) ? numeric : fallback));
}

function normalizeVerificationResult(result) {
  return {
    score: clampScore(result.score, 50),
    status: ["Suspicious", "Needs Review", "Likely Safe"].includes(result.status)
      ? result.status
      : "Needs Review",
    tone: ["danger", "warning", "success"].includes(result.tone)
      ? result.tone
      : "warning",
    reason: String(result.reason || "Analysis complete."),
    factors: Array.isArray(result.factors) ? result.factors.slice(0, 5).map(String) : [],
    reviews: Array.isArray(result.reviews)
      ? result.reviews.slice(0, 3).map((review) => ({
          source: String(review.source || "Signal"),
          content: String(review.content || ""),
          sentiment: ["danger", "warning", "positive"].includes(review.sentiment)
            ? review.sentiment
            : "warning",
        }))
      : [],
  };
}

function mergeUnique(primary = [], secondary = [], limit = 5) {
  const seen = new Set();
  const merged = [];

  for (const item of [...primary, ...secondary]) {
    const value = String(item || "").trim();
    const key = value.toLowerCase();

    if (value && !seen.has(key)) {
      seen.add(key);
      merged.push(value);
    }

    if (merged.length >= limit) {
      break;
    }
  }

  return merged;
}

function getVerificationVerdict(score) {
  if (score < 45) {
    return { status: "Suspicious", tone: "danger" };
  }

  if (score < 70) {
    return { status: "Needs Review", tone: "warning" };
  }

  return { status: "Likely Safe", tone: "success" };
}

function applyVerificationGuardrails(aiResult, heuristicResult) {
  let score = aiResult.score;

  if (heuristicResult.tone === "danger") {
    score = Math.min(score, heuristicResult.score, 44);
  } else if (heuristicResult.tone === "warning" && aiResult.tone === "success") {
    score = Math.min(score, 69);
  } else if (heuristicResult.score <= 55) {
    score = Math.min(score, heuristicResult.score + 8);
  }

  const verdict = getVerificationVerdict(score);
  const guardedByRules = verdict.tone !== aiResult.tone;

  return {
    ...aiResult,
    score: Math.round(score),
    status: verdict.status,
    tone: verdict.tone,
    reason: guardedByRules
      ? `${heuristicResult.reason} Gemini's narrative review was kept, but deterministic scam-safety rules lowered the verdict to avoid over-trusting risky signals.`
      : aiResult.reason,
    factors: mergeUnique(heuristicResult.factors, aiResult.factors, 5),
    reviews:
      aiResult.reviews.length > 0
        ? aiResult.reviews
        : heuristicResult.reviews.map((review) => ({
            source: review.source,
            content: review.content,
            sentiment: review.sentiment,
          })),
  };
}

/**
 * Extract a likely company name from the input text.
 * Looks for patterns like "at CompanyName", "from CompanyName", "Company: CompanyName", etc.
 */
function extractCompanyName(text) {
  // Try structured patterns first
  const patterns = [
    /(?:company|organization|employer|firm)\s*[:=]\s*([A-Z][A-Za-z0-9\s&.-]{1,40})/i,
    /(?:at|from|by|with)\s+([A-Z][A-Za-z0-9&.-]{2,30}(?:\s+[A-Z][A-Za-z0-9&.-]+){0,3})/,
    /(?:internship|offer|position|role)\s+(?:at|from|with)\s+([A-Z][A-Za-z0-9\s&.-]{2,40})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/[.,;:!?]+$/, "");
    }
  }

  return "";
}

export async function analyzeVerificationWithAI(text) {
  const heuristicResult = verifyInternship({ text });

  // Extract company name and fetch community signals in parallel with Gemini
  const companyName = extractCompanyName(text);

  const [geminiResult, communityResult] = await Promise.allSettled([
    askGemini(
      VERIFICATION_SYSTEM_PROMPT,
      `Analyze this internship offer:\n\n${text.slice(0, 6000)}`,
      {
        jsonMode: true,
        responseSchema: VERIFICATION_RESPONSE_SCHEMA,
        temperature: 0.15,
      }
    ),
    companyName
      ? fetchCommunitySignals(companyName)
      : Promise.resolve({ signals: [], sources: { reddit: null, glassdoor: null } }),
  ]);

  const communitySignals =
    communityResult.status === "fulfilled" ? communityResult.value.signals || [] : [];

  let baseResult;

  if (geminiResult.status === "fulfilled") {
    baseResult = {
      ...applyVerificationGuardrails(
        normalizeVerificationResult(geminiResult.value),
        heuristicResult
      ),
      model: GEMINI_MODEL,
    };
  } else {
    baseResult = {
      ...heuristicResult,
      reason: `${heuristicResult.reason} Gemini analysis was unavailable, so this result uses the built-in scam-signal rules.`,
      model: "heuristic-fallback",
    };
  }

  // Merge community signals into the reviews array
  if (communitySignals.length > 0) {
    const existingReviews = baseResult.reviews || [];
    const merged = [
      ...communitySignals.map((signal) => ({
        source: signal.source,
        content: signal.content,
        sentiment: signal.sentiment,
      })),
      ...existingReviews,
    ];
    baseResult.reviews = merged.slice(0, 5);
  }

  return baseResult;
}


export async function analyzeResumeWithAI({ resumeInfo, jdText }) {
  let userPrompt = `Analyze this resume for ATS compatibility:\n\n${resumeInfo.slice(0, 7000)}`;

  if (jdText.trim()) {
    userPrompt += `\n\nTarget Job Description:\n${jdText.slice(0, 3000)}`;
  } else {
    userPrompt += "\n\nNo specific job description provided. Give general ATS optimization advice.";
  }

  const result = await askGemini(RESUME_SYSTEM_PROMPT, userPrompt, {
    jsonMode: true,
    responseSchema: RESUME_RESPONSE_SCHEMA,
    temperature: 0.25,
  });

  return {
    score: clampScore(result.score, 65),
    metrics: {
      readability: clampScore(result.metrics?.readability, 60),
      formatting: clampScore(result.metrics?.formatting, 60),
      keywords: clampScore(result.metrics?.keywords, 50),
    },
    strengths: Array.isArray(result.strengths)
      ? result.strengths.slice(0, 4).map(String)
      : ["Resume uploaded successfully"],
    missingKeywords: Array.isArray(result.missingKeywords)
      ? result.missingKeywords.slice(0, 5).map(String)
      : ["Quantified impact"],
    suggestions: String(
      result.suggestions || "Consider tailoring your resume to specific job descriptions."
    ),
    usedJobDescription: jdText.trim().length > 0,
    model: GEMINI_MODEL,
  };
}
