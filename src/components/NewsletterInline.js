"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function NewsletterInline() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const addToast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !name) {
      addToast("Please fill in all fields", "error");
      return;
    }
    // Mock submission
    addToast("Roadmap PDF sent to your email!", "success");
    setEmail("");
    setName("");
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
          Join 50,000+ professionals. Drop your email below to receive the 2024 tech stack guide and weekly curated insights.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="First Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-surface-container-lowest dark:bg-[#060e20] border-none rounded-lg px-4 py-3 font-[family-name:var(--font-body)] text-sm focus:ring-2 focus:ring-primary/20 dark:focus:ring-[#adc6ff]/20 outline-none text-on-surface dark:text-[#dae2fd]"
          />
          <input
            type="email"
            placeholder="Work Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-[2] bg-surface-container-lowest dark:bg-[#060e20] border-none rounded-lg px-4 py-3 font-[family-name:var(--font-body)] text-sm focus:ring-2 focus:ring-primary/20 dark:focus:ring-[#adc6ff]/20 outline-none text-on-surface dark:text-[#dae2fd]"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white dark:bg-[#adc6ff] dark:text-[#0b1326] dark:hover:bg-[#adc6ff]/90 px-6 py-3 rounded-lg font-[family-name:var(--font-label)] text-sm font-bold transition-colors whitespace-nowrap"
          >
            Send Me the PDF
          </button>
        </form>
      </div>
    </div>
  );
}
