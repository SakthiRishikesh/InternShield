const BASE = "";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "same-origin",
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || "Something went wrong.");

  return data;
}

async function requestFormData(path, formData) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || "Something went wrong.");

  return data;
}

export const api = {
  auth: {
    me: () => request("/api/auth/me"),

    register: (body) =>
      request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    login: (body) =>
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    logout: () => request("/api/auth/logout", { method: "POST" }),
  },

  verify: {
    scan: (formData) => requestFormData("/api/verify", formData),
    createJob: (formData) => requestFormData("/api/verify/jobs", formData),
    eventsUrl: (id, token) =>
      `/api/ai-jobs/${id}/events${token ? `?token=${encodeURIComponent(token)}` : ""}`,
    scanText: (body) =>
      request("/api/verify", { method: "POST", body: JSON.stringify(body) }),
    history: () => request("/api/verify"),
  },

  resume: {
    analyze: (formData) => requestFormData("/api/resume/analyze", formData),
    createJob: (formData) => requestFormData("/api/resume/jobs", formData),
    eventsUrl: (id, token) =>
      `/api/ai-jobs/${id}/events${token ? `?token=${encodeURIComponent(token)}` : ""}`,
  },

  reviews: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/reviews${q ? `?${q}` : ""}`);
    },
    create: (body) =>
      request("/api/reviews", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/api/reviews/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id) => request(`/api/reviews/${id}`, { method: "DELETE" }),
    community: (query, source = "all") => {
      const q = new URLSearchParams({ q: query, source }).toString();
      return request(`/api/reviews/community?${q}`);
    },
    insights: (query) => {
      const q = new URLSearchParams({ q: query, mode: "insights" }).toString();
      return request(`/api/reviews/community?${q}`);
    },
  },

  profile: {
    get: () => request("/api/profile"),
    update: (body) =>
      request("/api/profile", { method: "PATCH", body: JSON.stringify(body) }),
  },

  dashboard: {
    stats: () => request("/api/dashboard/stats"),
    eventsUrl: () => "/api/dashboard/stats/events",
  },
};
