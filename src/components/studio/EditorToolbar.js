"use client";

import { I } from "./StudioIcons";

const FONTS = [
  { label: "Inter",        value: "Inter, sans-serif" },
  { label: "Manrope",      value: "Manrope, sans-serif" },
  { label: "Georgia",      value: "Georgia, serif" },
  { label: "Merriweather", value: "Merriweather, serif" },
  { label: "Playfair",     value: "'Playfair Display', serif" },
  { label: "Roboto",       value: "Roboto, sans-serif" },
  { label: "Lato",         value: "Lato, sans-serif" },
  { label: "Open Sans",    value: "'Open Sans', sans-serif" },
  { label: "Poppins",      value: "Poppins, sans-serif" },
  { label: "Nunito",       value: "Nunito, sans-serif" },
  { label: "Source Serif", value: "'Source Serif 4', serif" },
  { label: "Monospace",    value: "'Courier New', monospace" },
];

export default function EditorToolbar({ tbState, cmd }) {
  // Read active font from editor state
  const activeFont = tbState.fontFamily || "";
  const activeFontLabel =
    FONTS.find((f) => f.value === activeFont)?.label || "Inter";

  const handleFontChange = (e) => {
    const selected = FONTS.find((f) => f.label === e.target.value);
    if (!selected) return;
    cmd((editor) => {
      if (selected.label === "Inter") {
        // Inter is the default — clear any override so it inherits the body font
        editor.chain().focus().unsetFontFamily().run();
      } else {
        editor.chain().focus().setFontFamily(selected.value).run();
      }
    });
  };

  return (
    <div className="ed-toolbar">
      <select
        className="ed-font-sel"
        title="Font family"
        value={activeFontLabel}
        onChange={handleFontChange}
        style={{ fontFamily: activeFont || "inherit" }}
      >
        {FONTS.map((f) => (
          <option key={f.label} value={f.label} style={{ fontFamily: f.value }}>
            {f.label}
          </option>
        ))}
      </select>

      <div className="ed-sep" />

      <button className="ed-btn" title="Decrease font size" style={{ fontSize: 16 }}>−</button>
      <button className="ed-btn" title="Reset Size" style={{ width: 34, fontSize: 10, fontWeight: 700 }}>100%</button>
      <button className="ed-btn" title="Increase font size" style={{ fontSize: 16 }}>+</button>

      <div className="ed-sep" />

      <button
        className={`ed-btn ${tbState.bold ? "on" : ""}`}
        title="Bold (⌘B)"
        onClick={() => cmd((e) => e.chain().focus().toggleBold().run())}
        style={{ fontWeight: 800, fontSize: 14 }}
      >B</button>
      <button
        className={`ed-btn ${tbState.italic ? "on" : ""}`}
        title="Italic (⌘I)"
        onClick={() => cmd((e) => e.chain().focus().toggleItalic().run())}
        style={{ fontStyle: "italic", fontWeight: 700, fontSize: 14 }}
      >I</button>
      <button
        className={`ed-btn ${tbState.underline ? "on" : ""}`}
        title="Underline (⌘U)"
        onClick={() => cmd((e) => e.chain().focus().toggleUnderline().run())}
        style={{ textDecoration: "underline", fontSize: 14 }}
      >U</button>
      <button
        className={`ed-btn ${tbState.strike ? "on" : ""}`}
        title="Strikethrough"
        onClick={() => cmd((e) => e.chain().focus().toggleStrike().run())}
        style={{ textDecoration: "line-through", fontSize: 14 }}
      >S</button>

      {/* Text color picker */}
      <label
        title="Text color"
        style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}
      >
        <span
          className="ed-btn"
          style={{ fontSize: 13, fontWeight: 800, borderBottom: `3px solid ${tbState.color || "transparent"}` }}
        >A</span>
        <input
          type="color"
          value={tbState.color || "#111827"}
          onChange={(e) => cmd((editor) => editor.chain().focus().setColor(e.target.value).run())}
          style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", top: 0, left: 0 }}
        />
      </label>
      <button
        className="ed-btn"
        title="Remove text color"
        onClick={() => cmd((e) => e.chain().focus().unsetColor().run())}
        style={{ fontSize: 11, color: "var(--text3)" }}
      >✕A</button>

      <div className="ed-sep" />

      <button
        className={`ed-btn ${tbState.h2 ? "on" : ""}`}
        title="Heading 2"
        onClick={() => cmd((e) => e.chain().focus().toggleHeading({ level: 2 }).run())}
        style={{ fontSize: 11, fontWeight: 800 }}
      >H2</button>
      <button
        className={`ed-btn ${tbState.h3 ? "on" : ""}`}
        title="Heading 3"
        onClick={() => cmd((e) => e.chain().focus().toggleHeading({ level: 3 }).run())}
        style={{ fontSize: 11, fontWeight: 800 }}
      >H3</button>

      <div className="ed-sep" />

      <button
        className={`ed-btn ${tbState.bullet ? "on" : ""}`}
        title="Bullet list"
        onClick={() => cmd((e) => e.chain().focus().toggleBulletList().run())}
      >{I.bullet}</button>
      <button
        className={`ed-btn ${tbState.ordered ? "on" : ""}`}
        title="Numbered list"
        onClick={() => cmd((e) => e.chain().focus().toggleOrderedList().run())}
        style={{ fontSize: 11, fontWeight: 700 }}
      >1.</button>

      <div className="ed-sep" />

      <button
        className="ed-btn"
        title="Blockquote / Key Insight"
        onClick={() => cmd((e) => e.chain().focus().toggleBlockquote().run())}
        style={{ fontSize: 16 }}
      >"</button>
      <button
        className="ed-btn"
        title="Code block"
        onClick={() => cmd((e) => e.chain().focus().toggleCodeBlock().run())}
        style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}
      >{"{}"}</button>
      <button
        className="ed-btn"
        title="Horizontal divider"
        onClick={() => cmd((e) => e.chain().focus().setHorizontalRule().run())}
        style={{ fontSize: 15, fontWeight: 400 }}
      >—</button>

      <div className="ed-sep" />

      <button
        className="ed-btn"
        title="Undo (⌘Z)"
        onClick={() => cmd((e) => e.chain().focus().undo().run())}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      </button>
      <button
        className="ed-btn"
        title="Redo (⌘⇧Z)"
        onClick={() => cmd((e) => e.chain().focus().redo().run())}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
      </button>
    </div>
  );
}
