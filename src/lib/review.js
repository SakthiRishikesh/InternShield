import { clampNumber, normalizeSearchText, normalizeText } from "@/lib/helpers";

export const REVIEW_STATUSES = ["Safe", "Warning", "Scam"];

export const INITIAL_REVIEWS = [
  {
    id: 1,
    company: "TechNova",
    rating: 4.5,
    review:
      "Great mentorship and a thoughtful interview process. The team was transparent about scope and expectations.",
    status: "Safe",
  },
  {
    id: 2,
    company: "FakeCorp",
    rating: 1.2,
    review:
      "They asked me for a processing fee before sharing an offer letter. That was the clearest red flag in the process.",
    status: "Scam",
  },
  {
    id: 3,
    company: "CloudScale",
    rating: 3.8,
    review:
      "The work was real and the learning was strong, but the workload was heavier than the role description suggested.",
    status: "Warning",
  },
];

export function createEmptyReviewDraft() {
  return {
    company: "",
    rating: 5,
    review: "",
    status: "Safe",
  };
}

export function sanitizeReviewDraft(review) {
  return {
    company: normalizeText(review.company),
    rating: clampNumber(Number(review.rating), 1, 5),
    review: normalizeText(review.review),
    status: REVIEW_STATUSES.includes(review.status) ? review.status : "Safe",
  };
}

export function validateReviewDraft(review) {
  const sanitized = sanitizeReviewDraft(review);

  if (!sanitized.company) {
    return "Company name is required.";
  }

  if (sanitized.company.length < 2) {
    return "Company name should be at least 2 characters.";
  }

  if (!sanitized.review) {
    return "Review details are required.";
  }

  if (sanitized.review.length < 20) {
    return "Review details should be at least 20 characters so the report is useful.";
  }

  return "";
}

export function filterReviews(reviews, searchTerm) {
  const normalizedSearch = normalizeSearchText(searchTerm);

  if (!normalizedSearch) {
    return reviews;
  }

  return reviews.filter((review) =>
    normalizeSearchText(`${review.company} ${review.review}`).includes(normalizedSearch)
  );
}
