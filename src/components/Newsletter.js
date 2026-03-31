"use client";

import { useState } from "react";
import { useToast } from "./Toast";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const addToast = useToast();

  function handleSubscribe(e) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast("Please enter a valid email address.", "error");
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setEmail("");
      addToast("Successfully subscribed! Check your inbox.", "success");
    }, 1200);
  }

  return (
    <div className="bg-primary-container dark:bg-gradient-to-br dark:from-[#131b2e] dark:to-[#171f33] dark:border dark:border-[#424754]/30 p-8 rounded-xl text-white relative overflow-hidden group">
      <div className="relative z-10">
        <h4 className="font-[family-name:var(--font-headline)] font-extrabold text-2xl mb-4 leading-tight">
          Get started on something great
        </h4>
        <p className="text-on-primary-container text-sm mb-6 leading-relaxed">
          Join 50,000+ data professionals. Weekly curated research and career
          insights delivered to your inbox.
        </p>
        <form onSubmit={handleSubscribe} className="space-y-3">
          <input
            className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-sm placeholder:text-white/60 focus:ring-2 focus:ring-white/40 focus:outline-none transition-shadow"
            placeholder="Enter your work email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="newsletter-email"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-primary font-[family-name:var(--font-headline)] font-bold py-3 rounded-lg text-sm hover:bg-slate-50 transition-colors disabled:opacity-70"
            id="newsletter-subscribe"
          >
            {loading ? "Subscribing..." : "Subscribe Now"}
          </button>
        </form>
      </div>
      {/* Decorative element */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
    </div>
  );
}
