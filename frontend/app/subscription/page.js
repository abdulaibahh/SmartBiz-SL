"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SubscriptionPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/api/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPlan(res.data);
    } catch {
      toast.error("Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }

  async function startStripeCheckout() {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/api/subscription/checkout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.location.href = res.data.url;
    } catch {
      toast.error("Checkout failed");
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subscription</h1>

      <div className="card p-6 max-w-xl">
        <h2 className="text-lg font-semibold mb-2">Current Plan</h2>

        <p className="text-zinc-400 mb-4">
          {plan.active ? "Active Plan" : "Trial / Expired"}
        </p>

        {plan.trialEnds && (
          <p className="text-sm mb-3">
            Trial ends{" "}
            {formatDistanceToNow(new Date(plan.trialEnds), {
              addSuffix: true,
            })}
          </p>
        )}

        {plan.nextBilling && (
          <p className="text-sm mb-4">
            Next billing: {new Date(plan.nextBilling).toDateString()}
          </p>
        )}

        <button onClick={startStripeCheckout} className="btn">
          Upgrade to Pro — $10/month
        </button>
      </div>

      <div className="card p-6 max-w-xl mt-6">
        <h3 className="font-semibold mb-3">Manual Payment Options</h3>

        <p className="text-sm mb-2">
          📱 Orange Money: <b>+232 75756395</b>
        </p>

        <p className="text-sm">
          🏦 Bank Account: <b>540120520391143</b>
        </p>
      </div>
    </div>
  );
}
