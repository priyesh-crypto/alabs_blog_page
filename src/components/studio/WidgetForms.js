"use client";

import React from "react";

// --- Form Components Helpers ---
const inputStyle = "w-full px-3 py-2 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all";
const inputSmall = "w-full px-2 py-1.5 rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all";
const rmBtnStyle = "p-1 text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors";

function FieldLabel({ children }) {
  return (
    <label className="block text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5 ml-0.5">
      {children}
    </label>
  );
}

// --- Specific Widget Config Forms ---

export function AskAiConfig() {
  return (
    <div className="bg-[var(--color-surface-container)] p-4 rounded-xl border border-[var(--color-outline-variant)]">
      <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">
        No configuration needed. The AI widget automatically uses the article title, excerpt, and domain tags as context.
      </p>
    </div>
  );
}

export function RecommendedConfig({ config, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Max articles to show</FieldLabel>
        <input
          type="number"
          min={1}
          max={10}
          className={inputStyle}
          value={config.count ?? 3}
          onChange={(e) => onChange({ ...config, count: Number(e.target.value) })}
        />
        <p className="mt-1.5 text-[10px] text-[var(--color-on-surface-variant)]">
          Recommended: 3–5 articles for best layout balance.
        </p>
      </div>
    </div>
  );
}

export function AuthorSpotlightConfig() {
  return (
    <div className="bg-[var(--color-surface-container)] p-4 rounded-xl border border-[var(--color-outline-variant)]">
      <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">
        Always displays the article's own author. No additional configuration required.
      </p>
    </div>
  );
}

export function SalaryTableConfig({ config, onChange }) {
  const rows = config.rows ?? [];
  const setRows = (next) => onChange({ ...config, rows: next });

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Widget Title</FieldLabel>
        <input
          type="text"
          className={inputStyle}
          value={config.title ?? ""}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder="India DS Salaries"
        />
      </div>

      <div className="space-y-2.5">
        <FieldLabel>Salary Rows</FieldLabel>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                <input
                  type="text"
                  className={inputSmall}
                  value={row.role}
                  onChange={(e) => {
                    const r = [...rows];
                    r[i] = { ...r[i], role: e.target.value };
                    setRows(r);
                  }}
                  placeholder="Role"
                />
                <input
                  type="text"
                  className={inputSmall}
                  value={row.range}
                  onChange={(e) => {
                    const r = [...rows];
                    r[i] = { ...r[i], range: e.target.value };
                    setRows(r);
                  }}
                  placeholder="Range (e.g. ₹18–28 LPA)"
                />
                <input
                  type="text"
                  className={inputSmall}
                  value={row.meta}
                  onChange={(e) => {
                    const r = [...rows];
                    r[i] = { ...r[i], meta: e.target.value };
                    setRows(r);
                  }}
                  placeholder="Meta (City/Exp)"
                />
                <input
                  type="text"
                  className={inputSmall}
                  value={row.badge ?? ""}
                  onChange={(e) => {
                    const r = [...rows];
                    r[i] = { ...r[i], badge: e.target.value };
                    setRows(r);
                  }}
                  placeholder="Badge (Optional)"
                />
              </div>
              <button onClick={() => setRows(rows.filter((_, j) => j !== i))} className={rmBtnStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}

          {rows.length < 8 && (
            <button
              onClick={() => setRows([...rows, { role: "", range: "", meta: "", badge: "" }])}
              className="w-full py-2 border-2 border-dashed border-[var(--color-outline-variant)] rounded-lg text-xs font-medium text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
            >
              + Add Row
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>CTA Label</FieldLabel>
          <input
            type="text"
            className={inputStyle}
            value={config.cta_label ?? ""}
            onChange={(e) => onChange({ ...config, cta_label: e.target.value })}
            placeholder="Full Salary Report →"
          />
        </div>
        <div>
          <FieldLabel>CTA URL</FieldLabel>
          <input
            type="text"
            className={inputStyle}
            value={config.cta_url ?? ""}
            onChange={(e) => onChange({ ...config, cta_url: e.target.value })}
            placeholder="/salary-hub"
          />
        </div>
      </div>
    </div>
  );
}

export function CourseCardConfig({ config, onChange }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-[var(--color-surface-container)] p-3 rounded-xl border border-[var(--color-outline-variant)]">
        <div>
          <div className="text-xs font-bold text-[var(--color-on-surface)]">Match to Article Domain</div>
          <div className="text-[10px] text-[var(--color-on-surface-variant)]">Automatically finds related course from DB.</div>
        </div>
        <button
          onClick={() => onChange({ ...config, use_article_match: !config.use_article_match })}
          className={`relative w-10 h-5 rounded-full transition-colors ${config.use_article_match ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-outline-variant)]'}`}
        >
          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${config.use_article_match ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="space-y-4 pt-1">
        <div className="text-[11px] font-bold text-[var(--color-on-surface-variant)] border-b border-[var(--color-outline-variant)] pb-1 mb-2">
          FALLBACK SETTINGS
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Fallback Title</FieldLabel>
            <input
              type="text"
              className={inputStyle}
              value={config.fallback_title ?? ""}
              onChange={(e) => onChange({ ...config, fallback_title: e.target.value })}
              placeholder="Data Science Master"
            />
          </div>
          <div>
            <FieldLabel>Fallback Duration</FieldLabel>
            <input
              type="text"
              className={inputStyle}
              value={config.fallback_duration ?? ""}
              onChange={(e) => onChange({ ...config, fallback_duration: e.target.value })}
              placeholder="6 months"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Rating (0–5)</FieldLabel>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              className={inputStyle}
              value={config.fallback_rating ?? ""}
              onChange={(e) => onChange({ ...config, fallback_rating: Number(e.target.value) })}
            />
          </div>
          <div>
            <FieldLabel>CTA URL Override</FieldLabel>
            <input
              type="text"
              className={inputStyle}
              value={config.cta_url ?? ""}
              onChange={(e) => onChange({ ...config, cta_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <FieldLabel>CTA Label</FieldLabel>
          <input
            type="text"
            className={inputStyle}
            value={config.cta_label ?? "Enroll Now →"}
            onChange={(e) => onChange({ ...config, cta_label: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export const CONFIG_FORMS = {
  ask_ai:            AskAiConfig,
  recommended_posts: RecommendedConfig,
  author_spotlight:  AuthorSpotlightConfig,
  salary_table:      SalaryTableConfig,
  course_card:       CourseCardConfig,
};
