"use client";

import { Toggle } from "./StudioIcons";
import { authors } from "@/lib/data";
import { STUDIO_MODERATION_MODES } from "@/lib/config";

export default function AdvancedPanel({ state, set }) {
  return (
    <>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 8 }}>AUTHOR</div>
        <select value={state.authorId} onChange={(e) => set("authorId", e.target.value)}>
          {Object.entries(authors).map(([key, a]) => (
            <option key={key} value={key}>{a.name}</option>
          ))}
        </select>
        <div style={{ marginTop: 10 }}>
          <div className="f-lbl" style={{ marginBottom: 6 }}>
            Author bio <span style={{ fontSize: 9, color: "var(--text3)", background: "var(--bg3)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--border)", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>override</span>
          </div>
          <textarea value={state.authorBio} onChange={(e) => set("authorBio", e.target.value)} placeholder="Short bio for this article..." style={{ minHeight: 56 }} />
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="f-lbl" style={{ marginBottom: 6 }}>Fact-Checker</div>
          <input type="text" value={state.factChecker} onChange={(e) => set("factChecker", e.target.value)} placeholder="Review name or credential" />
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="f-lbl" style={{ marginBottom: 6 }}>Last Reviewed Date</div>
          <input type="date" value={state.lastReviewedDate} onChange={(e) => set("lastReviewedDate", e.target.value)} />
        </div>
      </div>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 8 }}>DISCUSSION</div>
        <div className="toggle-row" style={{ marginBottom: 10 }}>
          <span className="toggle-lbl">Enable Q&amp;A section</span>
          <Toggle checked={state.qaEnabled} onChange={(v) => set("qaEnabled", v)} />
        </div>
        <div className="toggle-row" style={{ marginBottom: 10 }}>
          <span className="toggle-lbl">Enable FAQ schema</span>
          <Toggle checked={state.faqSchemaEnabled} onChange={(v) => set("faqSchemaEnabled", v)} />
        </div>
        <div className="f-lbl" style={{ marginBottom: 6 }}>Moderation Mode</div>
        <div className="mode-row">
          {STUDIO_MODERATION_MODES.map((mode) => (
            <button key={mode} className={`mode-btn ${state.moderationMode === mode ? "on" : ""}`} onClick={() => set("moderationMode", mode)}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 8 }}>ACCESSIBILITY</div>
        <div className="toggle-row" style={{ marginBottom: 10 }}>
          <span className="toggle-lbl">Semantic search index</span>
          <Toggle checked={state.semanticIndexEnabled} onChange={(v) => set("semanticIndexEnabled", v)} />
        </div>
        <div className="toggle-row" style={{ marginBottom: 10 }}>
          <span className="toggle-lbl">Include in salary hub</span>
          <Toggle checked={state.salaryHubEnabled} onChange={(v) => set("salaryHubEnabled", v)} />
        </div>
        <div className="toggle-row" style={{ marginBottom: 12 }}>
          <span className="toggle-lbl">Dark mode compatible</span>
          <Toggle checked={state.darkModeCompat} onChange={(v) => set("darkModeCompat", v)} />
        </div>
        <div>
          <div className="f-lbl" style={{ marginBottom: 6 }}>Reading progress bar color</div>
          <div className="color-row">
            <input type="color" className="color-swatch" value={state.progressBarColor} onChange={(e) => set("progressBarColor", e.target.value)} />
            <input type="text" value={state.progressBarColor} onChange={(e) => set("progressBarColor", e.target.value)} style={{ flex: 1, fontFamily: "monospace" }} />
          </div>
          <div className="color-bar" style={{ background: state.progressBarColor }} />
        </div>
      </div>
    </>
  );
}
