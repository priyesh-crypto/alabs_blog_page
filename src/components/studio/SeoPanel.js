"use client";

import { STUDIO_SCHEMA_TYPES } from "@/lib/config";

export default function SeoPanel({ state, set }) {
  const kw = state.focusKeyword.toLowerCase().trim();
  const effectiveDesc = state.metaDesc || state.excerpt;

  const seoChecks = [
    { label: "Focus keyword in title", pass: !!(kw && state.postTitle.toLowerCase().includes(kw)) },
    { label: "Meta description present", pass: effectiveDesc.length >= 50, warn: effectiveDesc.length > 0 && effectiveDesc.length < 50 },
    { label: `Keyword density low (${kw ? "0.4%" : "—"})`, warn: true, pass: false },
    { label: state.altText?.trim().length >= 5 ? "Alt text present ✓" : "Missing alt text on images", pass: state.altText?.trim().length >= 5, warn: !state.altText?.trim().length },
    { label: "Internal links: 0 found", fail: true, pass: false },
  ];
  const seoScore = Math.round((seoChecks.filter((c) => c.pass).length / seoChecks.length) * 100);
  const seoGrade = seoScore >= 80 ? "Excellent" : seoScore >= 40 ? "Good — room to improve" : "Needs work";
  const seoColor = seoScore >= 80 ? "#16a34a" : seoScore >= 40 ? "#f97316" : "#ef4444";
  const circumference = 2 * Math.PI * 20;
  const seoArc = (seoScore / 100) * circumference;

  return (
    <>
      <div className="pp-field">
        <div className="seo-score-card">
          <div className="seo-ring">
            <svg width="54" height="54" viewBox="0 0 54 54">
              <circle cx="27" cy="27" r="20" fill="none" stroke="var(--bg4)" strokeWidth="5" />
              <circle cx="27" cy="27" r="20" fill="none" stroke={seoColor} strokeWidth="5"
                strokeDasharray={`${seoArc} ${circumference}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.4s ease" }}
              />
            </svg>
            <div className="seo-pct" style={{ color: seoColor }}>{seoScore}%</div>
          </div>
          <div>
            <div className="seo-grade" style={{ color: seoColor }}>{seoGrade}</div>
            <div className="seo-sub">{seoChecks.filter((c) => !c.pass).length} issues to resolve</div>
          </div>
        </div>
        <div className="seo-checks" style={{ marginTop: 12 }}>
          {seoChecks.map((c, i) => (
            <div key={i} className="seo-check">
              <div className={`seo-ic ${c.pass ? "ic-ok" : c.warn ? "ic-wn" : "ic-err"}`}>
                {c.pass ? "✓" : c.warn ? "!" : "✕"}
              </div>
              {c.label}
            </div>
          ))}
        </div>
      </div>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 6 }}>META TITLE <span className={`f-cnt ${state.metaTitle.length > 60 ? "bad" : ""}`}>{state.metaTitle.length} / 60</span></div>
        <input type="text" value={state.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder={state.postTitle || "SEO page title…"} />
      </div>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 6 }}>META DESCRIPTION <span className={`f-cnt ${state.metaDesc.length > 160 ? "bad" : state.metaDesc.length > 120 ? "warn" : ""}`}>{state.metaDesc.length} / 160</span></div>
        <textarea value={state.metaDesc} onChange={(e) => set("metaDesc", e.target.value)} placeholder={state.excerpt || "Brief description for search results…"} style={{ minHeight: 80 }} />
      </div>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 6 }}>FOCUS KEYWORD</div>
        <input type="text" value={state.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} placeholder="Neural Networks" />
      </div>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 6 }}>OG IMAGE URL</div>
        <input type="text" value={state.ogImage} onChange={(e) => set("ogImage", e.target.value)} placeholder="https://..." />
      </div>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 6 }}>SCHEMA TYPE</div>
        <select value={state.schemaType} onChange={(e) => set("schemaType", e.target.value)}>
          {STUDIO_SCHEMA_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 6 }}>
          CANONICAL URL
          <span style={{ fontSize: 9, color: "var(--text4)", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>optional</span>
        </div>
        <input type="text" value={state.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} placeholder="https://analytixlabs.co.in/..." />
      </div>
    </>
  );
}
