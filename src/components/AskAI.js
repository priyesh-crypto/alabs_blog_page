"use client";

import { useState, useRef } from "react";

export default function AskAI({ questions = [], context = "", placeholder = "Ask anything about this article..." }) {
  const [query, setQuery]     = useState("");
  const [answer, setAnswer]   = useState("");
  const [loading, setLoading] = useState(false);
  const [asked, setAsked]     = useState(false);
  const abortRef = useRef(null);

  async function ask(q) {
    const question = (q || query).trim();
    if (!question || loading) return;

    setQuery(question);
    setAnswer("");
    setLoading(true);
    setAsked(true);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setAnswer(full);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setAnswer("Sorry, something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    if (abortRef.current) abortRef.current.abort();
    setAsked(false);
    setQuery("");
    setAnswer("");
    setLoading(false);
  }

  return (
    <div className="rounded-3xl border p-6 bg-white border-outline-variant/10 shadow-sm"
      style={{ background: "linear-gradient(180deg, #FFFFFF 16%, #4C7FD2 100%)" }}>
      <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
        Ask the AI
      </h3>

      {/* Input row */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ask()}
          className="w-full pl-12 pr-12 py-3.5 rounded-2xl text-sm bg-white text-slate-900 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
        />
        <button onClick={() => ask()} aria-label="Ask AI"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-2xl"
            style={{ color: loading ? "#9ca3af" : "#f59e0b", fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </button>
      </div>

      {/* Answer panel */}
      {asked && (
        <div className="mb-5 p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-sm">

          {/* Question label */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
            AI Thinking about: "{query}"
          </p>

          {/* Loading dots */}
          {loading && !answer && (
            <div className="flex items-center gap-2 py-1">
              <span className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <span key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${delay}ms` }} />
                ))}
              </span>
              <span className="text-xs text-slate-600">Thinking…</span>
            </div>
          )}

          {/* Streamed answer */}
          {answer && (
            <p className="text-[13px] leading-relaxed text-slate-800">
              {answer}
              {loading && (
                <span className="inline-block w-0.5 h-3.5 bg-primary animate-pulse ml-0.5 translate-y-0.5 rounded-full" />
              )}
            </p>
          )}
        </div>
      )}

      {/* Suggested chips — shown when not in answer state */}
      {!asked && questions.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-widest px-1">
            Suggested by AI
          </p>
          <div className="flex flex-col gap-2">
            {questions.map((q, i) => (
              <button key={i} onClick={() => ask(q)}
                className="text-left px-4 py-3 rounded-2xl text-[13px] font-medium transition-all bg-white text-slate-700 border border-white/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset link after answer */}
      {asked && (
        <button onClick={reset}
          className="text-xs font-bold text-white hover:underline flex items-center gap-1 mt-2">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Ask another question
        </button>
      )}
    </div>
  );
}
