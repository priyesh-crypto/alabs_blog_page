/**
 * Studio icon SVGs, BrandLogo, Toggle, and collapsible Section.
 * Extracted from the monolith to keep page.js lean.
 */

// ── Icons ────────────────────────────────────────────────────
export const I = {
  edit: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12.5l1.5-1.5 7-7 1.5 1.5-7 7H2v-1.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="2" width="12" height="2.5" rx="1" /><rect x="2" y="6.75" width="12" height="2.5" rx="1" /><rect x="2" y="11.5" width="12" height="2.5" rx="1" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5l8 4.5-8 4.5V3.5z" /></svg>
  ),
  clock: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="8" r="6" /><path d="M8 5v3.5l2.5 1.5" strokeLinecap="round" />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 14V9h10v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 2h7l2 2v3H2V2h3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 4h12M5 4V3h6v1M4 4l1 10h6l1-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  view: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z" /><circle cx="8" cy="8" r="1.8" />
    </svg>
  ),
  bullet: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
      <circle cx="3" cy="4" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M6 4h8M6 8h8M6 12h8" strokeLinecap="round" />
    </svg>
  ),
};


// ── Toggle ───────────────────────────────────────────────────
export function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="tgl-track" />
      <span className="tgl-thumb" />
    </label>
  );
}

// ── Collapsible Section ──────────────────────────────────────
export function Section({ title, tier, open, onToggle, children }) {
  const tierCls = tier === "T1" ? "t1" : tier === "T2" ? "t2" : "t3";
  return (
    <>
      <div className="pp-sec-hd" onClick={onToggle}>
        <div className="pp-sec-title">
          {title}
          {tier && <span className={`pp-tier ${tierCls}`}>{tier}</span>}
        </div>
        <span className={`pp-chevron ${open ? "open" : ""}`}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {open && <div className="pp-sec-body">{children}</div>}
    </>
  );
}
