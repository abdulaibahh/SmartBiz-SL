const API_BASE = process.env.NEXT_PUBLIC_API_URL;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "API request failed");
  }

  return res.json();
}

export const api = {
  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  subscriptionStatus: () =>
    request("/api/subscription/status"),

  createCheckout: (plan) =>
    request("/api/subscription/checkout", {
      method: "POST",
      body: JSON.stringify({ plan }),
    }),

  dashboard: () => request("/api/dashboard"),

  settings: () => request("/api/settings"),

  updateSettings: (data) =>
    request("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
