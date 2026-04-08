"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { NEWSLETTER } from "@/lib/config";
import { subscribeAction } from "@/app/actions";

/**
 * Inline newsletter CTA (PDF download variant) — persists to Supabase.
 */
export default function NewsletterInline() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const addToast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !name) {
      addToast("Please fill in all fields", "error");
      return;
    }
    if (!email.includes("@")) {
      addToast("Please enter a valid email", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await subscribeAction({ email, name, source: "pdf-download" });
      if (result.success) {
        addToast("Roadmap PDF sent to your email!", "success");
        setEmail("");
        setName("");
      } else {
        addToast(result.error || "Something went wrong", "error");
      }
    } catch {
      addToast("Something went wrong. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-10 w-full bg-surface-container-low dark:bg-[#131b2e] border-l-4 border-primary dark:border-[#adc6ff] border-y border-r border-outline-variant/30 dark:border-[#424754]/50 p-6 rounded-r-xl shadow-sm relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute right-0 top-0 bottom-0 w-32 opacity-[0.03] pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full text-primary dark:text-[#adc6ff] fill-current">
          <path d="M0,0 L100,0 L100,100 Z" />
        </svg>
      </div>

      <div className="relative z-10">
        <h4 className="font-[family-name:var(--font-headline)] font-bold text-lg text-on-surface dark:text-[#dae2fd] mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-[#adc6ff]">download</span>
          Get our free Data Science Career Roadmap PDF
        </h4>
        <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm mb-4 max-w-lg">
          {NEWSLETTER.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="First Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="flex-1 bg-surface-container-lowest dark:bg-[#060e20] border-none rounded-lg px-4 py-3 font-[family-name:var(--font-body)] text-sm focus:ring-2 focus:ring-primary/20 dark:focus:ring-[#adc6ff]/20 outline-none text-on-surface dark:text-[#dae2fd] disabled:opacity-60"
          />
          <input
            type="email"
            placeholder="Work Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="flex-[2] bg-surface-container-lowest dark:bg-[#060e20] border-none rounded-lg px-4 py-3 font-[family-name:var(--font-body)] text-sm focus:ring-2 focus:ring-primary/20 dark:focus:ring-[#adc6ff]/20 outline-none text-on-surface dark:text-[#dae2fd] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white dark:bg-[#adc6ff] dark:text-[#0b1326] dark:hover:bg-[#adc6ff]/90 px-6 py-3 rounded-lg font-[family-name:var(--font-label)] text-sm font-bold transition-colors whitespace-nowrap disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send Me the PDF"}
          </button>
        </form>
      </div>
    </div>
  );
}
