"use client";

import { useState } from "react";

/**
 * Read-only, interactive Knowledge Check widget for the public article page.
 * Self-contained — owns its own answer/submitted state so multiple instances
 * on one page work independently.
 *
 * Props come directly from the Tiptap WidgetNode attrs stored in
 * data-widget-attrs JSON:
 *   question      string
 *   options       JSON string  e.g. '["Option A","Option B","Option C","Option D"]'
 *   correctIndex  number       0-based index of the correct option
 *   explanation   string       optional explanation shown after submit
 */
export default function FrontendKnowledgeCheck({ question, options: optionsRaw, correctIndex: correctIndexRaw, explanation }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Normalize — attrs arrive as strings from JSON serialization
  let options = [];
  try {
    options = typeof optionsRaw === "string" ? JSON.parse(optionsRaw) : (optionsRaw ?? []);
  } catch {
    options = [];
  }
  const correctIndex = Number(correctIndexRaw ?? 0);

  const isCorrect = selected === correctIndex;

  return (
    <div className="my-10 rounded-2xl border border-outline-variant/20 dark:border-[#424754] overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-3 flex items-center gap-2"
        style={{ background: "rgba(0,59,147,0.06)" }}
      >
        <span
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest"
          style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a" }}
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          Knowledge Check
        </span>
      </div>

      {/* Body */}
      <div className="p-6 bg-surface-container-lowest dark:bg-[#060e20]">
        {/* Question */}
        <p className="text-on-surface dark:text-[#dae2fd] font-medium mb-5 leading-relaxed">
          {question || "No question provided."}
        </p>

        {/* Options */}
        {options.length > 0 ? (
          <div className="space-y-3 mb-5">
            {options.map((opt, idx) => {
              let cls =
                "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ";
              if (!submitted) {
                cls +=
                  selected === idx
                    ? "bg-primary/10 dark:bg-[#adc6ff]/10 border-primary dark:border-[#adc6ff] text-on-surface dark:text-[#dae2fd]"
                    : "bg-surface-container dark:bg-[#131b2e] border-outline-variant/20 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] hover:border-primary/50 cursor-pointer";
              } else {
                if (idx === correctIndex) {
                  cls +=
                    "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300 font-semibold";
                } else if (idx === selected) {
                  cls +=
                    "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300 opacity-70";
                } else {
                  cls +=
                    "bg-surface-container dark:bg-[#131b2e] border-outline-variant/20 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] opacity-40";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => !submitted && setSelected(idx)}
                  className={cls}
                  disabled={submitted}
                >
                  <span className="font-bold mr-2 text-primary dark:text-[#adc6ff]">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant mb-5">No options configured.</p>
        )}

        {/* Submit / Result */}
        {!submitted ? (
          <button
            onClick={() => selected !== null && setSubmitted(true)}
            disabled={selected === null}
            className="px-6 py-2.5 rounded-full font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: "#16a34a" }}
          >
            Submit Answer
          </button>
        ) : (
          <div className="space-y-3">
            <span
              className={`flex items-center gap-1.5 text-sm font-bold ${
                isCorrect ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
              }`}
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isCorrect ? "check_circle" : "cancel"}
              </span>
              {isCorrect
                ? "Correct! Well done."
                : `Incorrect. Correct answer: ${options[correctIndex]}`}
            </span>

            {explanation && (
              <p className="text-sm text-on-surface-variant dark:text-[#8c909f] leading-relaxed border-l-2 border-primary/30 pl-3">
                {explanation}
              </p>
            )}

            <button
              onClick={() => { setSelected(null); setSubmitted(false); }}
              className="text-xs font-bold text-primary dark:text-[#adc6ff] hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
