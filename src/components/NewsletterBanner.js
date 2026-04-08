"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { NEWSLETTER } from "@/lib/config";
import { subscribeAction } from "@/app/actions";

/**
 * Gradient newsletter sign-up banner — persists to Supabase subscribers table.
 */
export default function NewsletterBanner() {
  const addToast = useToast();
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    const email = emailInput.trim();
    if (!email || !email.includes("@")) {
      addToast("Please enter a valid email", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await subscribeAction({ email, source: "newsletter" });
      if (result.success) {
        addToast("Subscribed! Check your inbox.", "success");
        setEmailInput("");
      } else {
        addToast(result.error || "Subscription failed", "error");
      }
    } catch {
      addToast("Something went wrong. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-8"
      style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)" }}
    >
      <h2 className="font-[family-name:var(--font-headline)] font-bold text-xl text-white mb-1">
        {NEWSLETTER.title}
      </h2>
      <p className="text-blue-100 text-sm mb-5">{NEWSLETTER.subtitle}</p>
      <div className="flex gap-3 flex-col sm:flex-row">
        <input
          type="email"
          placeholder={NEWSLETTER.placeholder}
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none bg-white text-gray-800 placeholder:text-gray-400 border-0 disabled:opacity-60"
        />
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="glass-btn px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap disabled:opacity-60"
        >
          {loading ? "Subscribing…" : NEWSLETTER.cta}
        </button>
      </div>
      <p className="text-[11px] text-blue-300/70 mt-3">{NEWSLETTER.footnote}</p>
    </div>
  );
}
