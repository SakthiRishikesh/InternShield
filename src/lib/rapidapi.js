/**
 * Community signal integration for InternShield.
 *
 * RapidAPI providers are marketplace subscriptions, so the app treats each
 * provider as optional and reports subscription/endpoint failures instead of
 * failing the verification flow. Reddit also has a public JSON fallback so the
 * community view can still surface internship discussions during development.
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const REDDIT_HOST = process.env.RAPIDAPI_REDDIT_HOST || "reddit-scraper2.p.rapidapi.com";
const REDDIT_SEARCH_PATH =
  process.env.RAPIDAPI_REDDIT_SEARCH_PATH ||
  "/search_posts?query={query}&sort=RELEVANCE&time=all&nsfw=0";

const GLASSDOOR_HOST = process.env.RAPIDAPI_GLASSDOOR_HOST || "glassdoor.p.rapidapi.com";
const GLASSDOOR_COMPANY_PATH =
  process.env.RAPIDAPI_GLASSDOOR_COMPANY_PATH || "/company/{company}";

if (!RAPIDAPI_KEY) {
  console.warn(
    "[RAPIDAPI] RAPIDAPI_KEY is not defined in .env.local; community signals will use fallbacks."
  );
}

function buildUrl(host, pathTemplate, replacements) {
  const path = Object.entries(replacements).reduce(
    (current, [key, value]) => current.replace(`{${key}}`, encodeURIComponent(value)),
    pathTemplate
  );

  return `https://${host}${path.startsWith("/") ? path : `/${path}`}`;
}

function normalizeRedditPosts(data, limit) {
  const rawPosts = Array.isArray(data)
    ? data
    : data?.data?.children?.map((child) => child.data) ||
      data?.data ||
      data?.posts ||
      data?.results ||
      [];

  return rawPosts.slice(0, limit).map((post) => ({
    title: post.title || post.postTitle || "",
    subreddit: post.subreddit || post.communityName || post.subreddit_name || "",
    url: post.url || post.permalink || post.postLink || "",
    score: post.score || post.upVotes || post.ups || 0,
    numComments: post.numComments || post.num_comments || post.numberOfComments || 0,
    text: (post.selftext || post.body || post.postText || "").slice(0, 300),
    author: post.author || post.authorName || "",
    createdUtc: post.created_utc || post.createdAt || null,
  }));
}

function summarizeProviderError(source, status, body) {
  const normalizedBody = String(body || "").slice(0, 220);

  if (status === 401 || status === 403) {
    return `${source} RapidAPI subscription is not active for this key.`;
  }

  if (status === 404) {
    return `${source} RapidAPI endpoint or host was not found.`;
  }

  if (status === 429) {
    return `${source} RapidAPI rate limit was reached.`;
  }

  return `${source} RapidAPI returned ${status}: ${normalizedBody || "Unknown error"}`;
}

async function searchPublicRedditPosts(query, { limit = 5 } = {}) {
  try {
    const url = new URL("https://www.reddit.com/search.json");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("sort", "relevance");
    url.searchParams.set("t", "all");

    const res = await fetch(url, {
      headers: { "User-Agent": "InternShield/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return {
        posts: [],
        error: `Public Reddit fallback returned ${res.status}.`,
      };
    }

    const data = await res.json();
    return { posts: normalizeRedditPosts(data, limit), error: null };
  } catch (err) {
    return {
      posts: [],
      error:
        err.name === "TimeoutError"
          ? "Public Reddit fallback timed out."
          : err.message || "Public Reddit fallback failed.",
    };
  }
}

/**
 * Search Reddit for posts matching a query (for example company + internship).
 * Returns normalized post objects plus source diagnostics.
 */
export async function searchRedditPosts(query, { limit = 5 } = {}) {
  if (!query?.trim()) {
    return { posts: [], error: "Query is required.", source: "reddit" };
  }

  let rapidApiError = RAPIDAPI_KEY ? null : "RAPIDAPI_KEY not configured.";

  if (RAPIDAPI_KEY) {
    try {
      const url = buildUrl(REDDIT_HOST, REDDIT_SEARCH_PATH, { query: query.trim() });
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": REDDIT_HOST,
        },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          posts: normalizeRedditPosts(data, limit),
          error: null,
          source: "rapidapi-reddit",
        };
      }

      const errorText = await res.text().catch(() => "");
      rapidApiError = summarizeProviderError("Reddit", res.status, errorText);
    } catch (err) {
      rapidApiError =
        err.name === "TimeoutError"
          ? "Reddit RapidAPI request timed out."
          : err.message || "Reddit RapidAPI request failed.";
    }
  }

  const fallback = await searchPublicRedditPosts(query, { limit });

  if (fallback.posts.length > 0) {
    return {
      posts: fallback.posts,
      error: rapidApiError ? `${rapidApiError} Used public Reddit fallback.` : null,
      source: "public-reddit",
    };
  }

  return {
    posts: [],
    error: rapidApiError || fallback.error || "No Reddit posts found.",
    source: "reddit",
  };
}

/**
 * Search for a company on Glassdoor through the configured RapidAPI provider.
 */
export async function searchGlassdoorCompany(companyName) {
  if (!companyName?.trim()) {
    return { company: null, error: "Company name is required." };
  }

  if (!RAPIDAPI_KEY) {
    return { company: null, error: "RAPIDAPI_KEY not configured." };
  }

  try {
    const url = buildUrl(GLASSDOOR_HOST, GLASSDOOR_COMPANY_PATH, {
      company: companyName.trim(),
    });

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": GLASSDOOR_HOST,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return {
        company: null,
        error: summarizeProviderError("Glassdoor", res.status, errorText),
        status: res.status,
      };
    }

    const data = await res.json();
    const raw = Array.isArray(data) ? data[0] : data?.data?.[0] || data;

    if (!raw || (!raw.name && !raw.companyName)) {
      return { company: null, error: "No company found." };
    }

    const company = {
      name: raw.name || raw.companyName || companyName,
      rating: raw.overallRating || raw.rating || raw.overall_rating || null,
      reviewCount: raw.numberOfReviews || raw.reviewCount || raw.numReviews || 0,
      industry: raw.industry || raw.sectorName || "",
      size: raw.size || raw.companySize || "",
      url: raw.url || raw.websiteUrl || "",
      headquarters: raw.headquarters || raw.location || "",
    };

    return { company, error: null };
  } catch (err) {
    return {
      company: null,
      error:
        err.name === "TimeoutError"
          ? "Glassdoor RapidAPI request timed out."
          : err.message || "Glassdoor RapidAPI request failed.",
    };
  }
}

/**
 * Fetch normalized community signals from Reddit and Glassdoor.
 */
export async function fetchCommunitySignals(companyOrQuery) {
  if (!companyOrQuery?.trim()) {
    return { signals: [], sources: { reddit: null, glassdoor: null } };
  }

  const query = companyOrQuery.trim();
  const searchQuery = `${query} internship`;

  const [redditResult, glassdoorResult] = await Promise.allSettled([
    searchRedditPosts(searchQuery, { limit: 3 }),
    searchGlassdoorCompany(query),
  ]);

  const reddit =
    redditResult.status === "fulfilled"
      ? redditResult.value
      : { posts: [], error: redditResult.reason?.message };
  const glassdoor =
    glassdoorResult.status === "fulfilled"
      ? glassdoorResult.value
      : { company: null, error: glassdoorResult.reason?.message };

  const signals = [];

  if (glassdoor.company) {
    const gd = glassdoor.company;
    const ratingText = gd.rating ? `${gd.rating}/5` : "N/A";
    const reviewText = gd.reviewCount ? `${gd.reviewCount} reviews` : "No reviews";

    signals.push({
      source: "Glassdoor",
      content: `${gd.name} has a ${ratingText} rating with ${reviewText} on Glassdoor.${gd.industry ? ` Industry: ${gd.industry}.` : ""}`,
      sentiment: gd.rating >= 3.5 ? "positive" : gd.rating >= 2.5 ? "warning" : "danger",
    });
  } else if (glassdoor.error && !glassdoor.error.includes("not configured")) {
    signals.push({
      source: "Glassdoor",
      content: `Glassdoor data unavailable: ${glassdoor.error}`,
      sentiment: "warning",
    });
  }

  if (reddit.posts?.length > 0) {
    reddit.posts.slice(0, 2).forEach((post) => {
      const title = post.title || "Reddit discussion";
      const subreddit = post.subreddit ? `r/${post.subreddit}` : "Reddit";
      const snippet = post.text ? ` - ${post.text.slice(0, 120)}...` : "";

      signals.push({
        source: subreddit,
        content: `${title}${snippet}`,
        sentiment: determineSentiment(`${post.title} ${post.text}`),
      });
    });
  } else if (reddit.error && !reddit.error.includes("not configured")) {
    signals.push({
      source: "Reddit",
      content: `Reddit data unavailable: ${reddit.error}`,
      sentiment: "warning",
    });
  }

  return {
    signals: signals.slice(0, 3),
    sources: {
      reddit: {
        posts: reddit.posts?.length || 0,
        source: reddit.source || "reddit",
        error: reddit.error || null,
      },
      glassdoor: {
        found: Boolean(glassdoor.company),
        error: glassdoor.error || null,
      },
    },
  };
}

export async function fetchCompanyInsights(companyName) {
  if (!companyName?.trim()) {
    return { error: "Company name is required." };
  }

  const company = companyName.trim();
  const [redditResult, glassdoorResult] = await Promise.allSettled([
    searchRedditPosts(`"${company}" internship review culture employee`, { limit: 12 }),
    searchGlassdoorCompany(company),
  ]);

  const reddit =
    redditResult.status === "fulfilled"
      ? redditResult.value
      : { posts: [], error: redditResult.reason?.message, source: "reddit" };
  const glassdoor =
    glassdoorResult.status === "fulfilled"
      ? glassdoorResult.value
      : { company: null, error: glassdoorResult.reason?.message };

  const companyMatchedPosts = filterCompanyPosts(reddit.posts || [], company).slice(0, 8);
  const redditAnalysis = analyzeRedditPosts(companyMatchedPosts);
  const glassdoorAnalysis = analyzeGlassdoorCompany(glassdoor.company);
  const reputation = buildReputation(glassdoorAnalysis, redditAnalysis, {
    redditError: reddit.error,
    glassdoorError: glassdoor.error,
  });

  return {
    company,
    generatedAt: new Date().toISOString(),
    summary: buildInsightSummary(company, reputation, redditAnalysis, glassdoorAnalysis),
    culture: {
      sentiment: redditAnalysis.cultureSentiment,
      themes: redditAnalysis.cultureThemes,
      highlights: redditAnalysis.highlights,
      concerns: redditAnalysis.concerns,
    },
    employeeReviews: {
      glassdoor: glassdoor.company
        ? {
            name: glassdoor.company.name,
            rating: glassdoor.company.rating,
            reviewCount: glassdoor.company.reviewCount,
            industry: glassdoor.company.industry,
            size: glassdoor.company.size,
            headquarters: glassdoor.company.headquarters,
            url: glassdoor.company.url,
          }
        : null,
      reddit: {
        count: companyMatchedPosts.length,
        source: reddit.source || "reddit",
        sentimentBreakdown: redditAnalysis.sentimentBreakdown,
        samples: redditAnalysis.samples,
      },
    },
    reputation,
    sources: {
      reddit: {
        available: Boolean(companyMatchedPosts.length),
        matchedPosts: companyMatchedPosts.length,
        fetchedPosts: reddit.posts?.length || 0,
        source: reddit.source || "reddit",
        error:
          reddit.error ||
          (reddit.posts?.length && !companyMatchedPosts.length
            ? "Reddit returned posts, but none clearly matched the company name."
            : null),
      },
      glassdoor: {
        available: Boolean(glassdoor.company),
        error: glassdoor.error || null,
      },
    },
  };
}

function filterCompanyPosts(posts, company) {
  const normalizedCompany = company.toLowerCase();
  const companyWords = normalizedCompany
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3);

  return posts.filter((post) => {
    const text = `${post.title || ""} ${post.text || ""} ${post.subreddit || ""}`.toLowerCase();

    if (normalizedCompany.length <= 4) {
      return new RegExp(`\\b${escapeRegExp(normalizedCompany)}\\b`, "i").test(text);
    }

    return (
      text.includes(normalizedCompany) ||
      companyWords.some((word) => new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(text))
    );
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function determineSentiment(text) {
  const lower = (text || "").toLowerCase();
  const dangerWords = [
    "scam",
    "fraud",
    "fake",
    "avoid",
    "ripoff",
    "don't apply",
    "warning",
    "terrible",
    "worst",
  ];
  const positiveWords = [
    "great",
    "legitimate",
    "legit",
    "recommend",
    "good experience",
    "helpful",
    "excellent",
    "amazing",
  ];

  if (dangerWords.some((word) => lower.includes(word))) return "danger";
  if (positiveWords.some((word) => lower.includes(word))) return "positive";
  return "warning";
}

function analyzeRedditPosts(posts) {
  const sentimentBreakdown = { positive: 0, warning: 0, danger: 0 };
  const themes = new Map();
  const highlights = [];
  const concerns = [];

  const cultureKeywords = [
    "culture",
    "work life",
    "work-life",
    "mentor",
    "mentorship",
    "learning",
    "manager",
    "team",
    "supportive",
    "growth",
    "flexible",
    "remote",
    "stipend",
    "salary",
    "unpaid",
    "toxic",
    "pressure",
    "overtime",
    "scam",
    "bond",
  ];

  posts.forEach((post) => {
    const text = `${post.title || ""} ${post.text || ""}`;
    const sentiment = determineSentiment(text);
    sentimentBreakdown[sentiment] += 1;

    cultureKeywords.forEach((keyword) => {
      if (text.toLowerCase().includes(keyword)) {
        themes.set(keyword, (themes.get(keyword) || 0) + 1);
      }
    });

    if (sentiment === "positive" && highlights.length < 3) {
      highlights.push(post.title || "Positive Reddit discussion found.");
    }

    if ((sentiment === "danger" || sentiment === "warning") && concerns.length < 3) {
      concerns.push(post.title || "Cautionary Reddit discussion found.");
    }
  });

  const cultureThemes = [...themes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([theme, count]) => ({ theme, mentions: count }));

  const samples = posts.slice(0, 5).map((post) => ({
    title: post.title,
    subreddit: post.subreddit,
    score: post.score,
    comments: post.numComments,
    sentiment: determineSentiment(`${post.title || ""} ${post.text || ""}`),
    url: post.url,
  }));

  const cultureSentiment =
    sentimentBreakdown.danger > 0
      ? "concerning"
      : sentimentBreakdown.positive > sentimentBreakdown.warning
        ? "positive"
        : posts.length
          ? "mixed"
          : "unknown";

  return {
    cultureSentiment,
    cultureThemes,
    highlights,
    concerns,
    sentimentBreakdown,
    samples,
  };
}

function analyzeGlassdoorCompany(company) {
  if (!company) {
    return {
      score: null,
      ratingLabel: "unavailable",
      reviewSignal: "Glassdoor company data was not available from the configured API.",
    };
  }

  const rating = Number(company.rating);
  const score = Number.isFinite(rating) ? Math.round((rating / 5) * 100) : null;

  return {
    score,
    ratingLabel:
      score === null
        ? "rating unavailable"
        : score >= 75
          ? "strong"
          : score >= 55
            ? "mixed"
            : "weak",
    reviewSignal: company.reviewCount
      ? `${company.reviewCount} Glassdoor reviews reported by the API.`
      : "Glassdoor review count was not available.",
  };
}

function buildReputation(glassdoorAnalysis, redditAnalysis, errors) {
  let score = 50;
  const positives = [];
  const concerns = [];

  if (glassdoorAnalysis.score !== null) {
    score += Math.round((glassdoorAnalysis.score - 50) * 0.45);
    positives.push(`Glassdoor rating signal is ${glassdoorAnalysis.ratingLabel}.`);
  } else if (errors.glassdoorError) {
    concerns.push(errors.glassdoorError);
  }

  score += redditAnalysis.sentimentBreakdown.positive * 6;
  score -= redditAnalysis.sentimentBreakdown.warning * 3;
  score -= redditAnalysis.sentimentBreakdown.danger * 12;

  if (redditAnalysis.highlights.length) {
    positives.push(...redditAnalysis.highlights.slice(0, 2));
  }

  if (redditAnalysis.concerns.length) {
    concerns.push(...redditAnalysis.concerns.slice(0, 2));
  }

  if (errors.redditError && !redditAnalysis.samples.length) {
    concerns.push(errors.redditError);
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    level: finalScore >= 75 ? "positive" : finalScore >= 50 ? "mixed" : "risky",
    positives: positives.slice(0, 4),
    concerns: concerns.slice(0, 4),
    confidence:
      glassdoorAnalysis.score !== null && redditAnalysis.samples.length
        ? "medium"
        : redditAnalysis.samples.length
          ? "limited"
          : "low",
  };
}

function buildInsightSummary(company, reputation, redditAnalysis, glassdoorAnalysis) {
  const cultureText =
    redditAnalysis.cultureThemes.length > 0
      ? `Common Reddit themes include ${redditAnalysis.cultureThemes
          .slice(0, 3)
          .map((item) => item.theme)
          .join(", ")}.`
      : "Reddit did not provide enough culture-specific themes.";

  const glassdoorText =
    glassdoorAnalysis.score !== null
      ? `Glassdoor contributes a ${glassdoorAnalysis.ratingLabel} rating signal.`
      : glassdoorAnalysis.reviewSignal;

  return `${company} currently has a ${reputation.level} reputation signal with ${reputation.confidence} confidence. ${cultureText} ${glassdoorText}`;
}
