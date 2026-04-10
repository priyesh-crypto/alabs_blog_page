"use client";

import { Toggle } from "./StudioIcons";

export default function AdvancedPanel({ state, set }) {
  return (
    <>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 6 }}>
          CANONICAL URL
          <span style={{ fontSize: 9, color: "var(--text4)", fontWeight: 400, letterSpacing: 0, textTransform: "none", marginLeft: 5 }}>optional</span>
        </div>
        <input type="text" value={state.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} placeholder="https://analytixlabs.co.in/..." />
        <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 4 }}>Leave empty to use the default article URL.</div>
      </div>
      <div className="pp-field">
        <div className="f-lbl" style={{ marginBottom: 8 }}>INDEXING</div>
        <div className="toggle-row">
          <span className="toggle-lbl">No-index (hide from search engines)</span>
          <Toggle checked={state.noIndex} onChange={(v) => set("noIndex", v)} />
        </div>
        <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 4 }}>
          When on, a <code style={{ fontSize: 10 }}>noindex</code> meta tag is added. Use for drafts or thin content.
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
