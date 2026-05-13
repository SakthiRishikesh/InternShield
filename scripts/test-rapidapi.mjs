/**
 * RapidAPI connectivity test for InternShield.
 *
 * Usage:
 *   node scripts/test-rapidapi.mjs
 *
 * Optional provider overrides:
 *   RAPIDAPI_REDDIT_HOST
 *   RAPIDAPI_REDDIT_SEARCH_PATH
 *   RAPIDAPI_GLASSDOOR_HOST
 *   RAPIDAPI_GLASSDOOR_COMPANY_PATH
 */

import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const REDDIT_HOST = process.env.RAPIDAPI_REDDIT_HOST || "reddit-scraper2.p.rapidapi.com";
const REDDIT_SEARCH_PATH =
  process.env.RAPIDAPI_REDDIT_SEARCH_PATH ||
  "/search_posts?query={query}&sort=RELEVANCE&time=all&nsfw=0";
const GLASSDOOR_HOST = process.env.RAPIDAPI_GLASSDOOR_HOST || "glassdoor.p.rapidapi.com";
const GLASSDOOR_COMPANY_PATH =
  process.env.RAPIDAPI_GLASSDOOR_COMPANY_PATH || "/company/{company}";

function buildUrl(host, pathTemplate, replacements) {
  const path = Object.entries(replacements).reduce(
    (current, [key, value]) => current.replace(`{${key}}`, encodeURIComponent(value)),
    pathTemplate
  );

  return `https://${host}${path.startsWith("/") ? path : `/${path}`}`;
}

function normalizeRedditPosts(data) {
  const rawPosts = Array.isArray(data)
    ? data
    : data?.data?.children?.map((child) => child.data) ||
      data?.data ||
      data?.posts ||
      data?.results ||
      [];

  return rawPosts;
}

function summarizeStatus(status, body) {
  if (status === 401 || status === 403) return "not subscribed or unauthorized";
  if (status === 404) return "provider host or endpoint not found";
  if (status === 429) return "rate limited";
  return String(body || "request failed").slice(0, 140);
}

async function testRapidApi(name, url, host) {
  if (!RAPIDAPI_KEY) {
    return { name, success: false, status: null, message: "RAPIDAPI_KEY is missing" };
  }

  try {
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": host,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        name,
        success: false,
        status: res.status,
        message: summarizeStatus(res.status, body),
      };
    }

    const data = await res.json();
    return { name, success: true, status: res.status, data };
  } catch (err) {
    return {
      name,
      success: false,
      status: null,
      message: err.name === "TimeoutError" ? "request timed out" : err.message,
    };
  }
}

async function testPublicRedditFallback() {
  const url = new URL("https://www.reddit.com/search.json");
  url.searchParams.set("q", "internship scam warning");
  url.searchParams.set("limit", "3");
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("t", "all");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "InternShield/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return {
        name: "Public Reddit fallback",
        success: false,
        status: res.status,
        message: "fallback request failed",
      };
    }

    const data = await res.json();
    const posts = normalizeRedditPosts(data);
    return {
      name: "Public Reddit fallback",
      success: true,
      status: res.status,
      count: posts.length,
      samples: posts.slice(0, 3).map((post) => ({
        title: post.title || "Untitled",
        subreddit: post.subreddit || "unknown",
      })),
    };
  } catch (err) {
    return {
      name: "Public Reddit fallback",
      success: false,
      status: null,
      message: err.name === "TimeoutError" ? "request timed out" : err.message,
    };
  }
}

function printResult(result) {
  const status = result.status ? `HTTP ${result.status}` : "no HTTP status";
  const outcome = result.success ? "PASS" : "FAIL";
  console.log(`${result.name}: ${outcome} (${status})`);

  if (result.message) {
    console.log(`  ${result.message}`);
  }

  if (typeof result.count === "number") {
    console.log(`  Items found: ${result.count}`);
  }

  if (result.samples?.length) {
    result.samples.forEach((sample, index) => {
      console.log(`  ${index + 1}. ${sample.title} [r/${sample.subreddit}]`);
    });
  }
}

async function main() {
  console.log("InternShield RapidAPI connectivity test");
  console.log(RAPIDAPI_KEY ? "RAPIDAPI_KEY is configured." : "RAPIDAPI_KEY is missing.");
  console.log("");

  const redditUrl = buildUrl(REDDIT_HOST, REDDIT_SEARCH_PATH, {
    query: "internship scam warning",
  });
  const glassdoorUrl = buildUrl(GLASSDOOR_HOST, GLASSDOOR_COMPANY_PATH, {
    company: "Google",
  });

  const reddit = await testRapidApi("RapidAPI Reddit", redditUrl, REDDIT_HOST);
  const glassdoor = await testRapidApi("RapidAPI Glassdoor", glassdoorUrl, GLASSDOOR_HOST);
  const publicReddit = await testPublicRedditFallback();

  printResult(reddit);
  printResult(glassdoor);
  printResult(publicReddit);

  console.log("");
  console.log("Summary");
  console.log(`RapidAPI Reddit: ${reddit.success ? "working" : reddit.message}`);
  console.log(`RapidAPI Glassdoor: ${glassdoor.success ? "working" : glassdoor.message}`);
  console.log(
    `Reddit fallback: ${publicReddit.success ? `working (${publicReddit.count} posts)` : publicReddit.message}`
  );

  if (!reddit.success || !glassdoor.success) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
