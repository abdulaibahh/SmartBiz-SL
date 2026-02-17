"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { subscriptionAPI } from "@/services/api";
import toast from "react-hot-toast";
import { CreditCard, Check, Sparkles, Loader2, Calendar, Shield } from "lucide-react";

function SubscriptionContent() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await subscriptionAPI.getStatus();
        setStatus(res.data);
      } catch (error) {
        // Demo mode - simulate active subscription
        setStatus({ active: true, trialEnds: null, nextBilling: new Date(Date.now() + 30*24*60*60*1000) });
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleCheckout = async (plan) => {
    setCheckoutLoading(true);
    try {
      const res = await subscriptionAPI.createCheckout(plan);
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.success("Demo mode: Checkout would redirect to Stripe");
      }
    } catch (error) {
      toast.error("Checkout not available in demo mode");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });
  };

  const plans = [
    {
      name: "Pro",
      price: 19,
      period: "month",
      features: [
        "Unlimited sales records",
        "AI Business Insights",
        "Debt Tracking",
        "Inventory Management",
        "Priority Support"
      ],
      popular: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Current Plan</h2>
              <p className="text-zinc-500">
                {status?.active ? (
                  <span className="text-emerald-400">Active Subscription</span>
                ) : (
                  <span className="text-amber-400">Trial Period</span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">$19<span className="text-lg text-zinc-500 font-normal">/mo</span></p>
            <p className="text-sm text-zinc-500">Pro Plan</p>
          </div>
        </div>

        {/* Status Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <Calendar className="text-zinc-500" size={20} />
            <div>
              <p className="text-xs text-zinc-500">Next Billing</p>
              <p className="text-white font-medium">{status?.nextBilling ? formatDate(status.nextBilling) : "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="text-zinc-500" size={20} />
            <div>
              <p className="text-xs text-zinc-500">Trial Ends</p>
              <p className="text-white font-medium">{status?.trialEnds ? formatDate(status.trialEnds) : "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Check className="text-emerald-400" size={20} />
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <p className="text-emerald-400 font-medium">{status?.active ? "Active" : "Inactive"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative bg-zinc-900/80 border rounded-2xl p-6 ${
                plan.popular ? "border-indigo-500" : "border-zinc-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 rounded-full text-xs font-medium text-white flex items-center gap-1">
                  <Sparkles size={12} />
                  Most Popular
                </div>
              )}
              
              <h4 className="text-lg font-semibold text-white">{plan.name}</h4>
              <div className="mt-2 mb-4">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-zinc-500">/{plan.period}</span>
              </div>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-zinc-400">
                    <Check size={16} className="text-emerald-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.name.toLowerCase())}
                disabled={checkoutLoading || status?.active}
                className="w-full py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-500"
              >
                {checkoutLoading ? (
                  <Loader2 size={20} className="animate-spin mx-auto" />
                ) : status?.active ? (
                  "Current Plan"
                ) : (
                  "Upgrade Now"
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Subscription() {
  return (
    <ProtectedRoute>
      <SubscriptionContent />
    </ProtectedRoute>
  );
}
