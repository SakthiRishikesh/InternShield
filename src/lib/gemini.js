export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getCandidateModels() {
  const fallbackModels = (
    process.env.GEMINI_FALLBACK_MODELS || "gemini-2.5-flash,gemini-2.0-flash"
  )
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return [...new Set([GEMINI_MODEL, ...fallbackModels])];
}

function getApiKey() {
  const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API key is not defined in .env.local.");
  }

  return apiKey;
}

function getTextFromResponse(data) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

function parseJsonResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }

    throw new Error("Gemini returned invalid JSON.");
  }
}

export async function askGemini(systemPrompt, userPrompt, options = {}) {
  const apiKey = getApiKey();
  const models = options.model ? [options.model] : getCandidateModels();

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxTokens ?? 2048,
    },
  };

  if (options.jsonMode) {
    body.generationConfig.responseMimeType = "application/json";
  }

  if (options.responseSchema) {
    body.generationConfig.responseSchema = options.responseSchema;
  }

  let lastError = null;

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 45000);

    try {
      const res = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "Unknown error");
        const error = new Error(`Gemini API error (${res.status}): ${errorBody}`);
        error.status = res.status;
        lastError = error;

        if ([429, 500, 502, 503, 504].includes(res.status)) {
          continue;
        }

        throw error;
      }

      const data = await res.json();
      const text = getTextFromResponse(data);

      if (!text) {
        const finishReason = data?.candidates?.[0]?.finishReason;
        throw new Error(
          finishReason
            ? `Gemini returned no text. Finish reason: ${finishReason}.`
            : "Gemini returned no text."
        );
      }

      return options.jsonMode ? parseJsonResponse(text) : text;
    } catch (err) {
      if (err.name === "AbortError") {
        lastError = new Error("Gemini API request timed out.");
        continue;
      }

      if ([429, 500, 502, 503, 504].includes(err.status)) {
        lastError = err;
        continue;
      }

      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("Gemini API request failed.");
}
