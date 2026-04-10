"use client";

import { useRef, useState } from "react";
import { STUDIO_SCHEMA_TYPES } from "@/lib/config";
import { I } from "./StudioIcons";

export default function SeoPanel({ state, set, showToast }) {
  const kw = state.focusKeyword.toLowerCase().trim();
  const effectiveDesc = state.metaDesc || state.excerpt;
  const ogFileInputRef = useRef(null);
  const [isOverriding, setIsOverriding] = useState(false);

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

  const handleOgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) { set("ogImage", data.url); setIsOverriding(false); }
      else showToast("Upload failed: " + (data.error || "unknown"), "err");
    } catch { showToast("Upload failed. Please try again.", "err"); }
    finally { e.target.value = ""; }
  };

  const socialPreview = state.ogImage || state.featuredImage;

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

      {/* URL Slug */}
      <div className="pp-field">
        <div className="f-lbl">URL SLUG</div>
        <input type="text" value={state.slug} onChange={(e) => set("slug", e.target.value)} placeholder="your-post-slug" />
        <div className="slug-path">
          /article/{state.slug || "your-post-slug"}
          <div className="slug-hint" style={{ fontSize: 11, color: "var(--text4)", marginTop: 4, fontStyle: "italic" }}>
            This determines the public URL. Changes will update the redirection path.
          </div>
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

      {/* OG / Social Image */}
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>OG / SOCIAL IMAGE</span>
          {state.ogImage && (
            <button onClick={() => { set("ogImage", ""); setIsOverriding(false); }} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 11, padding: 0 }}>Remove override</button>
          )}
        </div>
        <input ref={ogFileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleOgUpload} />

        {state.ogImage ? (
          /* Custom OG image has been set */
          <div style={{ position: "relative" }}>
            <img src={state.ogImage} alt="OG/Social" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: "var(--radius)", display: "block" }} />
            <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 4 }}>Custom override</div>
          </div>
        ) : socialPreview ? (
          /* Showing featured image as default */
          <div style={{ position: "relative" }}>
            {isOverriding ? (
              <div className="img-drop" onClick={() => ogFileInputRef.current?.click()}>
                <div className="img-drop-icon">{I.image}</div>
                <div className="img-drop-text"><b>Click to upload</b> social image</div>
              </div>
            ) : (
              <>
                <img src={socialPreview} alt="Social preview (featured image)" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: "var(--radius)", display: "block", opacity: 0.85 }} />
                <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 4 }}>Using featured image</div>
                <button
                  onClick={() => setIsOverriding(true)}
                  style={{ position: "absolute", bottom: 6, right: 6, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, padding: "3px 10px", cursor: "pointer", fontWeight: 600 }}
                >Override Social Image</button>
              </>
            )}
          </div>
        ) : (
          /* No image at all */
          <div className="img-drop" onClick={() => ogFileInputRef.current?.click()}>
            <div className="img-drop-icon">{I.image}</div>
            <div className="img-drop-text"><b>Click to upload</b> or drag &amp; drop</div>
          </div>
        )}
      </div>

      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 6 }}>SCHEMA TYPE</div>
        <select value={state.schemaType} onChange={(e) => set("schemaType", e.target.value)}>
          {STUDIO_SCHEMA_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </>
  );
}
