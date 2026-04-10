"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// ── Widget type registry ──────────────────────────────────────────
const WIDGET_TYPES = {
  ask_ai:            { label: "Ask the AI",           color: "#4f46e5", description: "AI assistant contextualised to the article." },
  recommended_posts: { label: "Recommended Articles", color: "#0e7490", description: "Articles recommended by domain tags." },
  author_spotlight:  { label: "Author Spotlight",     color: "#003b93", description: "Author card linked to /author/[slug]." },
  salary_table:      { label: "Salary Table",         color: "#16a34a", description: "India DS salary preview with link to /salary-hub." },
  course_card:       { label: "Course CTA",           color: "#b45309", description: "Recommended course card with enroll link." },
};

const WIDGET_DEFAULTS = {
  ask_ai:            { config: {} },
  recommended_posts: { config: { count: 3 } },
  author_spotlight:  { config: { use_article_author: true } },
  salary_table: {
    config: {
      title: "India DS Salaries",
      rows: [
        { role: "Data Scientist", range: "₹18–28 LPA", meta: "Bangalore · 3-5 yrs", badge: "" },
        { role: "ML Engineer",    range: "₹18–28 LPA", meta: "Mumbai · 2-4 yrs",    badge: "" },
        { role: "Data Analyst",   range: "₹10–20 LPA", meta: "Delhi NCR · 0-3 yrs", badge: "" },
      ],
      cta_label: "Full Salary Report + Calculator →",
      cta_url: "/salary-hub",
    },
  },
  course_card: {
    config: {
      use_article_match: true,
      fallback_title: "Data Science Master Program",
      fallback_duration: "6 months",
      fallback_rating: 4.8,
      cta_label: "Enroll Now →",
      cta_url: "",
    },
  },
};

function newId() {
  return "w-" + Math.random().toString(36).slice(2, 9);
}

// ── Config sub-forms ──────────────────────────────────────────────

function AskAiConfig() {
  return (
    <p style={{ fontSize: 12, color: "var(--text3)", margin: 0 }}>
      No configuration needed. The AI widget automatically uses the article title, excerpt, and domain tags as context.
    </p>
  );
}

function RecommendedConfig({ config, onChange }) {
  return (
    <div>
      <FieldLabel>Max articles to show</FieldLabel>
      <input
        type="number" min={1} max={10}
        value={config.count ?? 3}
        onChange={e => onChange({ ...config, count: Number(e.target.value) })}
        style={inputStyle}
      />
    </div>
  );
}

function AuthorSpotlightConfig({ config, onChange }) {
  return (
    <p style={{ fontSize: 12, color: "var(--text3)", margin: 0 }}>
      Always displays the article's own author. No additional configuration required.
    </p>
  );
}

function SalaryTableConfig({ config, onChange }) {
  const rows = config.rows ?? [];
  const setRows = (next) => onChange({ ...config, rows: next });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <FieldLabel>Widget title</FieldLabel>
        <input type="text" value={config.title ?? ""} onChange={e => onChange({ ...config, title: e.target.value })} style={inputStyle} placeholder="India DS Salaries" />
      </div>
      <div>
        <FieldLabel>Salary rows</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px 28px", gap: 6, alignItems: "center" }}>
              <input type="text" value={row.role} onChange={e => { const r=[...rows]; r[i]={...r[i],role:e.target.value}; setRows(r); }} style={inputSmall} placeholder="Role" />
              <input type="text" value={row.range} onChange={e => { const r=[...rows]; r[i]={...r[i],range:e.target.value}; setRows(r); }} style={inputSmall} placeholder="₹18–28 LPA" />
              <input type="text" value={row.meta} onChange={e => { const r=[...rows]; r[i]={...r[i],meta:e.target.value}; setRows(r); }} style={inputSmall} placeholder="City · exp" />
              <input type="text" value={row.badge ?? ""} onChange={e => { const r=[...rows]; r[i]={...r[i],badge:e.target.value}; setRows(r); }} style={inputSmall} placeholder="badge" />
              <button onClick={() => setRows(rows.filter((_, j) => j !== i))} style={rmBtnStyle}>×</button>
            </div>
          ))}
          {rows.length < 8 && (
            <button onClick={() => setRows([...rows, { role: "", range: "", meta: "", badge: "" }])}
              style={{ fontSize: 12, color: "var(--text3)", background: "none", border: "1px dashed var(--border)", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>
              + Add row
            </button>
          )}
        </div>
        <p style={{ fontSize: 11, color: "var(--text4)", marginTop: 6 }}>Columns: Role · Range · Meta (location/exp) · Badge (optional)</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <FieldLabel>CTA label</FieldLabel>
          <input type="text" value={config.cta_label ?? ""} onChange={e => onChange({ ...config, cta_label: e.target.value })} style={inputStyle} placeholder="Full Salary Report →" />
        </div>
        <div>
          <FieldLabel>CTA URL</FieldLabel>
          <input type="text" value={config.cta_url ?? ""} onChange={e => onChange({ ...config, cta_url: e.target.value })} style={inputStyle} placeholder="/salary-hub" />
        </div>
      </div>
    </div>
  );
}

function CourseCardConfig({ config, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="toggle-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Match to article domain tags</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>Uses the article's domain tags to find the closest course from the DB.</div>
        </div>
        <button
          onClick={() => onChange({ ...config, use_article_match: !config.use_article_match })}
          style={{
            width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", flexShrink: 0,
            background: config.use_article_match ? "var(--primary)" : "var(--border)",
            position: "relative", transition: "background 0.2s",
          }}
        >
          <span style={{
            position: "absolute", top: 3, left: config.use_article_match ? 21 : 3,
            width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
          }} />
        </button>
      </div>
      <p style={{ fontSize: 11, color: "var(--text4)", margin: 0 }}>
        Fallback values are used when no course match is found.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <FieldLabel>Fallback title</FieldLabel>
          <input type="text" value={config.fallback_title ?? ""} onChange={e => onChange({ ...config, fallback_title: e.target.value })} style={inputStyle} placeholder="Data Science Master Program" />
        </div>
        <div>
          <FieldLabel>Fallback duration</FieldLabel>
          <input type="text" value={config.fallback_duration ?? ""} onChange={e => onChange({ ...config, fallback_duration: e.target.value })} style={inputStyle} placeholder="6 months" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <FieldLabel>Fallback rating (0–5)</FieldLabel>
          <input type="number" min={0} max={5} step={0.1} value={config.fallback_rating ?? ""} onChange={e => onChange({ ...config, fallback_rating: Number(e.target.value) })} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>CTA URL (overrides DB link)</FieldLabel>
          <input type="text" value={config.cta_url ?? ""} onChange={e => onChange({ ...config, cta_url: e.target.value })} style={inputStyle} placeholder="https://..." />
        </div>
      </div>
      <div>
        <FieldLabel>CTA label</FieldLabel>
        <input type="text" value={config.cta_label ?? "Enroll Now →"} onChange={e => onChange({ ...config, cta_label: e.target.value })} style={inputStyle} />
      </div>
    </div>
  );
}

const CONFIG_FORMS = {
  ask_ai:            AskAiConfig,
  recommended_posts: RecommendedConfig,
  author_spotlight:  AuthorSpotlightConfig,
  salary_table:      SalaryTableConfig,
  course_card:       CourseCardConfig,
};

// ── Micro helpers ─────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
  background: "var(--bg2)", color: "var(--text)", fontSize: 13, boxSizing: "border-box",
};
const inputSmall = { ...inputStyle, padding: "6px 8px", fontSize: 12 };
const rmBtnStyle = {
  background: "none", border: "none", cursor: "pointer", color: "var(--text3)",
  fontSize: 18, lineHeight: 1, padding: "0 2px", alignSelf: "center",
};
function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{children}</div>;
}

// ── Widget card ───────────────────────────────────────────────────
function WidgetCard({ widget, index, total, onMove, onToggle, onDelete, onConfigChange }) {
  const [expanded, setExpanded] = useState(false);
  const meta = WIDGET_TYPES[widget.type] || { label: widget.type, color: "#888" };
  const ConfigForm = CONFIG_FORMS[widget.type];

  return (
    <div style={{
      border: `1.5px solid ${widget.enabled ? meta.color + "55" : "var(--border)"}`,
      borderRadius: 12, background: "var(--bg2)", overflow: "hidden",
      opacity: widget.enabled ? 1 : 0.55, transition: "opacity 0.2s",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
        {/* Reorder */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
          <button disabled={index === 0} onClick={() => onMove(index, -1)}
            style={{ background: "none", border: "none", cursor: index === 0 ? "default" : "pointer", color: index === 0 ? "var(--text4)" : "var(--text3)", fontSize: 12, lineHeight: 1, padding: 0 }}>▲</button>
          <button disabled={index === total - 1} onClick={() => onMove(index, 1)}
            style={{ background: "none", border: "none", cursor: index === total - 1 ? "default" : "pointer", color: index === total - 1 ? "var(--text4)" : "var(--text3)", fontSize: 12, lineHeight: 1, padding: 0 }}>▼</button>
        </div>

        {/* Color dot + label */}
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{widget.label || meta.label}</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>{meta.description}</div>
        </div>

        {/* Enable toggle */}
        <button onClick={() => onToggle(index)} style={{
          width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0,
          background: widget.enabled ? meta.color : "var(--border)", position: "relative", transition: "background 0.2s",
        }}>
          <span style={{
            position: "absolute", top: 2, left: widget.enabled ? 18 : 2,
            width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
          }} />
        </button>

        {/* Expand */}
        {ConfigForm && (
          <button onClick={() => setExpanded(e => !e)}
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", color: "var(--text3)", fontSize: 11, padding: "3px 10px", fontWeight: 600 }}>
            {expanded ? "Close" : "Edit"}
          </button>
        )}

        {/* Delete */}
        <button onClick={() => onDelete(index)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text4)", fontSize: 18, lineHeight: 1, padding: 0, marginLeft: 2 }}>
          ×
        </button>
      </div>

      {/* Config form */}
      {expanded && ConfigForm && (
        <div style={{ padding: "14px 14px 16px", borderTop: "1px solid var(--border)", background: "var(--bg3)" }}>
          <ConfigForm
            config={widget.config ?? {}}
            onChange={(next) => onConfigChange(index, next)}
          />
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function SiteLayoutPage() {
  const router = useRouter();
  const { authorProfile, loading: authLoading } = useAuth();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [addType, setAddType] = useState("ask_ai");
  const [updatedBy, setUpdatedBy] = useState("");

  useEffect(() => {
    if (!authLoading && !authorProfile) router.replace("/studio/login");
  }, [authLoading, authorProfile, router]);

  useEffect(() => {
    fetch("/api/site-config")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.sidebar_widgets) {
          setWidgets(data.sidebar_widgets);
          setUpdatedBy(data.updated_by || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const move = (index, dir) => {
    const next = [...widgets];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setWidgets(next);
  };

  const toggle = (index) => {
    const next = [...widgets];
    next[index] = { ...next[index], enabled: !next[index].enabled };
    setWidgets(next);
  };

  const remove = (index) => {
    setWidgets(widgets.filter((_, i) => i !== index));
  };

  const updateConfig = (index, config) => {
    const next = [...widgets];
    next[index] = { ...next[index], config };
    setWidgets(next);
  };

  const addWidget = () => {
    const defaults = WIDGET_DEFAULTS[addType] || { config: {} };
    const meta = WIDGET_TYPES[addType] || { label: addType };
    setWidgets(prev => [...prev, {
      id: newId(),
      type: addType,
      enabled: true,
      label: meta.label,
      ...defaults,
    }]);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sidebar_widgets: widgets }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "ok", text: "Layout saved. Changes are live immediately." });
        setUpdatedBy(authorProfile?.name || "you");
      } else {
        setMessage({ type: "err", text: data.error || "Save failed." });
      }
    } catch {
      setMessage({ type: "err", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
        <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Back nav */}
        <button onClick={() => router.push("/studio")}
          style={{ background: "none", border: "none", color: "var(--text3)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, marginBottom: 32, padding: 0 }}>
          ← Back to Studio
        </button>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: "0 0 6px", letterSpacing: "-0.3px" }}>
            Site Layout
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
            Configure the right sidebar shown on all article pages. Changes are reflected immediately on publish.
          </p>
          {updatedBy && (
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--text4)" }}>Last saved by {updatedBy}</p>
          )}
        </div>

        {/* Toast */}
        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginBottom: 24, fontSize: 13, fontWeight: 500,
            background: message.type === "ok" ? "var(--green-dim, #dcfce7)" : "var(--red-dim, #fee2e2)",
            color: message.type === "ok" ? "var(--green, #16a34a)" : "var(--red, #ef4444)",
            border: `1px solid ${message.type === "ok" ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)"}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Section: Right Sidebar Widgets */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                RIGHT SIDEBAR — ARTICLE PAGES
              </div>
              <div style={{ fontSize: 12, color: "var(--text4)" }}>
                Drag up/down to reorder. Toggle to show/hide. Widgets render top-to-bottom.
              </div>
            </div>
            <span style={{ fontSize: 12, color: "var(--text3)", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 20, padding: "3px 12px", fontWeight: 600 }}>
              {widgets.filter(w => w.enabled).length} active
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {widgets.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text4)", border: "1px dashed var(--border)", borderRadius: 12, fontSize: 13 }}>
                No widgets configured. Add one below.
              </div>
            )}
            {widgets.map((widget, i) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                index={i}
                total={widgets.length}
                onMove={move}
                onToggle={toggle}
                onDelete={remove}
                onConfigChange={updateConfig}
              />
            ))}
          </div>
        </div>

        {/* Add widget */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "14px 16px", border: "1px dashed var(--border)", borderRadius: 12, marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", flexShrink: 0 }}>Add widget:</div>
          <select value={addType} onChange={e => setAddType(e.target.value)}
            style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontSize: 13 }}>
            {Object.entries(WIDGET_TYPES).map(([type, meta]) => (
              <option key={type} value={type}>{meta.label}</option>
            ))}
          </select>
          <button onClick={addWidget}
            style={{ padding: "7px 18px", borderRadius: 8, background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            + Add
          </button>
        </div>

        {/* Save */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={() => router.push("/studio")}
            style={{ padding: "10px 22px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text2)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding: "10px 28px", borderRadius: 8, background: "var(--primary)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.75 : 1 }}>
            {saving && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />}
            {saving ? "Saving…" : "Save Layout"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
