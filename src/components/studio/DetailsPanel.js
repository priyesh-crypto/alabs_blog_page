"use client";

import { useRef, useState, useEffect } from "react";
import { Toggle, Section, I } from "./StudioIcons";
import {
  STUDIO_CATEGORIES,
  STUDIO_LEAD_MAGNETS,
  STUDIO_NEWSLETTER_PLACEMENTS,
} from "@/lib/config";

export default function DetailsPanel({ state, dispatch, set, showToast }) {
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState(STUDIO_CATEGORIES);
  const [studioCourses, setStudioCourses] = useState([]);

  // Fetch topics from DB (admin-managed) and merge with config defaults
  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          // fallback: merge from published post categories
          fetch("/api/categories")
            .then((r) => r.ok ? r.json() : [])
            .then((cats) => {
              if (Array.isArray(cats) && cats.length > 0) {
                setCategories(Array.from(new Set([...STUDIO_CATEGORIES, ...cats])));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    // Fetch courses from DB
    fetch("/api/courses")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setStudioCourses(data.map((c) => ({ id: c.id, name: c.title })));
        }
      })
      .catch(() => {});
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("isUploadingImage", true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) set("featuredImage", data.url);
      else showToast("Upload failed: " + (data.error || "unknown"), "err");
    } catch { showToast("Upload failed. Please try again.", "err"); }
    finally { set("isUploadingImage", false); e.target.value = ""; }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); dispatch({ type: "ADD_TAG", value: state.tagInput }); }
    else if (e.key === "Backspace" && !state.tagInput && state.tags.length > 0) dispatch({ type: "POP_TAG" });
  };

  const handleEntityTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); dispatch({ type: "ADD_ENTITY_TAG", value: state.entityTagInput }); }
    else if (e.key === "Backspace" && !state.entityTagInput && state.entityTags.length > 0) dispatch({ type: "POP_ENTITY_TAG" });
  };

  const excerptLen = state.excerpt.length;

  return (
    <>
      {/* Featured Image */}
      <div className="pp-field">
        <div className="f-lbl">FEATURED IMAGE</div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
        {state.featuredImage ? (
          <div style={{ position: "relative" }}>
            <img src={state.featuredImage} alt="Featured" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: "var(--radius)", display: "block" }} />
            <button onClick={() => set("featuredImage", "")} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, padding: "2px 8px", cursor: "pointer" }}>Remove</button>
          </div>
        ) : (
          <div className="img-drop" onClick={() => fileInputRef.current?.click()} style={{ opacity: state.isUploadingImage ? 0.6 : 1 }}>
            <div className="img-drop-icon">{I.image}</div>
            <div className="img-drop-text">
              {state.isUploadingImage ? "Uploading…" : <><b>Click to upload</b> or drag &amp; drop</>}
            </div>
          </div>
        )}
      </div>

      {/* Alt Text (SEO Required) */}
      {state.featuredImage && (
        <div className="pp-field" style={{ paddingTop: 0 }}>
          <div className="f-lbl">
            ALT TEXT <span style={{ color: "var(--red)", fontSize: 11 }}>*</span>
            <span className={`f-cnt ${state.altText.length > 150 ? "bad" : state.altText.length >= 5 ? "" : state.altText.length > 0 ? "warn" : ""}`}>
              {state.altText.length}/150
            </span>
          </div>
          <input
            type="text"
            value={state.altText}
            onChange={(e) => {
              set("altText", e.target.value);
              const len = e.target.value.trim().length;
              if (len === 0) set("altTextError", "Alt text is required for SEO");
              else if (len < 5) set("altTextError", "Alt text must be at least 5 characters");
              else if (len > 150) set("altTextError", "Alt text must be 150 characters or less");
              else set("altTextError", "");
            }}
            placeholder="Descriptive alt text for this image..."
            className={state.altTextError ? "alt-err-input" : ""}
          />
          {state.altTextError && (
            <div className="alt-err-msg">{state.altTextError}</div>
          )}
        </div>
      )}

      {/* Excerpt */}
      <div className="pp-field">
        <div className="f-lbl">
          EXCERPT
          <span className={`f-cnt ${excerptLen > 160 ? "bad" : excerptLen > 100 ? "warn" : ""}`}>{excerptLen}/100</span>
        </div>
        <textarea value={state.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="A brief summary for search results..." style={{ minHeight: 68 }} />
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

      {/* Topics */}
      <div className="pp-field">
        <div className="f-lbl">TOPICS</div>
        <div className="topics-row">
          {categories.map((cat) => (
            <button key={cat} className={`topic-pill ${state.category === cat ? "sel" : ""}`} onClick={() => set("category", cat)}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Domain Tags */}
      <div className="pp-field">
        <div className="f-lbl">DOMAIN TAGS</div>
        <div className="tag-wrap" onClick={() => document.getElementById("studio-tag-input")?.focus()}>
          {state.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
              <span className="tag-x" onClick={() => dispatch({ type: "REMOVE_TAG", value: tag })}>×</span>
            </span>
          ))}
          <input id="studio-tag-input" className="tag-input" placeholder={state.tags.length === 0 ? "Add tag, press Enter" : ""} value={state.tagInput} onChange={(e) => set("tagInput", e.target.value)} onKeyDown={handleTagKeyDown} onBlur={() => { if (state.tagInput.trim()) dispatch({ type: "ADD_TAG", value: state.tagInput }); }} />
        </div>
      </div>

      {/* Skill Level */}
      <div className="pp-field">
        <div className="f-lbl">SKILL LEVEL</div>
        <div className="skill-row">
          {[{ label: "Beginner", cls: "s-beg" }, { label: "Intermediate", cls: "s-int" }, { label: "Advanced", cls: "s-adv" }].map(({ label, cls }) => (
            <button key={label} className={`skill-btn ${state.skill === label ? cls : ""}`} onClick={() => set("skill", label)}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Collapsible Sections ── */}

      {/* Course Mapping T2 */}
      <Section title="Course Mapping" tier="T2" open={state.openSections.courses} onToggle={() => dispatch({ type: "TOGGLE_SECTION", key: "courses" })}>
        <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4, fontWeight: 600 }}>Map to Courses</div>
        {studioCourses.map((course) => (
          <label key={course.id} className="course-item">
            <input type="checkbox" checked={state.mappedCourses.includes(course.id)} onChange={() => dispatch({ type: "TOGGLE_COURSE", value: course.id })} />
            <span className="course-lbl">{course.name}</span>
          </label>
        ))}
        {state.mappedCourses.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div className="f-lbl" style={{ marginBottom: 6 }}>Custom CTA Headline</div>
            <input type="text" value={state.courseCTA} onChange={(e) => set("courseCTA", e.target.value)} placeholder="Ready to go deeper? Enroll now →" />
          </div>
        )}
      </Section>

      {/* Lead Magnet T2 */}
      <Section title="Lead Magnet & CTA" tier="T2" open={state.openSections.leadmagnet} onToggle={() => dispatch({ type: "TOGGLE_SECTION", key: "leadmagnet" })}>
        <div>
          <div className="f-lbl" style={{ marginBottom: 6 }}>Newsletter Placement</div>
          <select value={state.newsletterPlacement} onChange={(e) => set("newsletterPlacement", e.target.value)}>
            {STUDIO_NEWSLETTER_PLACEMENTS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="f-lbl" style={{ marginBottom: 6 }}>CTA URL</div>
          <select value={state.leadMagnetPDF} onChange={(e) => set("leadMagnetPDF", e.target.value)}>
            {STUDIO_LEAD_MAGNETS.map((lm) => <option key={lm.id} value={lm.id}>{lm.name}</option>)}
          </select>
        </div>
        <div className="toggle-row">
          <span className="toggle-lbl">Exit-intent popup</span>
          <Toggle checked={state.exitIntentEnabled} onChange={(v) => set("exitIntentEnabled", v)} />
        </div>
      </Section>

      {/* Knowledge Check T2 */}
      <Section title="Knowledge Check" tier="T2" open={state.openSections.quiz} onToggle={() => dispatch({ type: "TOGGLE_SECTION", key: "quiz" })}>
        {state.quizQuestions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {state.quizQuestions.map((q, qi) => (
              <div key={q.id} className="quiz-card">
                <div className="quiz-hd">
                  <span className="quiz-num">Q{qi + 1}</span>
                  <button className="quiz-rm" onClick={() => dispatch({ type: "REMOVE_QUIZ_QUESTION", id: q.id })}>Remove</button>
                </div>
                <input className="quiz-q-in" type="text" value={q.question} onChange={(e) => dispatch({ type: "UPDATE_QUIZ_QUESTION", id: q.id, field: "question", value: e.target.value })} placeholder="Enter question..." />
                <div className="quiz-opts">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="quiz-opt-wrap">
                      <input type="text" className={`quiz-opt-in ${q.correctIndex === oi ? "correct" : ""}`} value={opt} onChange={(e) => dispatch({ type: "UPDATE_QUIZ_OPTION", qId: q.id, optIdx: oi, value: e.target.value })} placeholder={`Option ${oi + 1}`} />
                      <button className={`quiz-opt-mark ${q.correctIndex === oi ? "picked" : ""}`} onClick={() => dispatch({ type: "UPDATE_QUIZ_QUESTION", id: q.id, field: "correctIndex", value: oi })} title="Mark correct">{q.correctIndex === oi ? "✓" : ""}</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="quiz-add" onClick={() => dispatch({ type: "ADD_QUIZ_QUESTION" })}>
          <span style={{ fontSize: 16 }}>+</span> Add Question
        </button>
        <div className="toggle-row">
          <span className="toggle-lbl">GA4 event tracking</span>
          <Toggle checked={state.ga4TrackingEnabled} onChange={(v) => set("ga4TrackingEnabled", v)} />
        </div>
      </Section>

      {/* AI Hints T1 */}
      <Section title="AI Recommendation Hints" tier="T1" open={state.openSections.ai} onToggle={() => dispatch({ type: "TOGGLE_SECTION", key: "ai" })}>
        <div className="toggle-row">
          <span className="toggle-lbl">Include in AI recommendation</span>
          <Toggle checked={state.aiInclusionEnabled} onChange={(v) => set("aiInclusionEnabled", v)} />
        </div>
        <div>
          <div className="f-lbl" style={{ marginBottom: 6 }}>
            Concept Entity Tags
            <span style={{ fontSize: 9, color: "var(--text3)", background: "var(--bg3)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--border)", fontWeight: 400, letterSpacing: 0 }}>for embeddings</span>
          </div>
          <div className="tag-wrap" onClick={() => document.getElementById("entity-tag-input")?.focus()}>
            {state.entityTags.map((tag) => (
              <span key={tag} className="tag-chip">{tag}<span className="tag-x" onClick={() => dispatch({ type: "REMOVE_ENTITY_TAG", value: tag })}>×</span></span>
            ))}
            <input id="entity-tag-input" className="tag-input" placeholder={state.entityTags.length === 0 ? "Neural network, overfitting…" : ""} value={state.entityTagInput} onChange={(e) => set("entityTagInput", e.target.value)} onKeyDown={handleEntityTagKeyDown} onBlur={() => { if (state.entityTagInput.trim()) dispatch({ type: "ADD_ENTITY_TAG", value: state.entityTagInput }); }} />
          </div>
        </div>
        <div>
          <div className="f-lbl" style={{ marginBottom: 6 }}>
            Manual Related Post IDs
            <span style={{ fontSize: 9, color: "var(--text3)", background: "var(--bg3)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--border)", fontWeight: 400, letterSpacing: 0 }}>comma-separated</span>
          </div>
          <input type="text" value={state.relatedPostIds} onChange={(e) => set("relatedPostIds", e.target.value)} placeholder="12, 45, 78" />
        </div>
      </Section>

      {/* Author & Trust T3 */}
      <Section title="Author & Trust Signals" tier="T3" open={state.openSections.author} onToggle={() => dispatch({ type: "TOGGLE_SECTION", key: "author" })}>
        <div>
          <div className="f-lbl" style={{ marginBottom: 6 }}>Author bio
            <span style={{ fontSize: 9, color: "var(--text3)", background: "var(--bg3)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--border)", fontWeight: 400, letterSpacing: 0 }}>override</span>
          </div>
          <textarea value={state.authorBio} onChange={(e) => set("authorBio", e.target.value)} placeholder="Short bio for this article..." style={{ minHeight: 56 }} />
        </div>
        <div>
          <div className="f-lbl" style={{ marginBottom: 6 }}>Fact-Checker</div>
          <input type="text" value={state.factChecker} onChange={(e) => set("factChecker", e.target.value)} placeholder="Review name or credential" />
        </div>
        <div>
          <div className="f-lbl" style={{ marginBottom: 6 }}>Last Reviewed Date</div>
          <input type="date" value={state.lastReviewedDate} onChange={(e) => set("lastReviewedDate", e.target.value)} />
        </div>
      </Section>

      {/* Discussion T3 */}
      <Section title="Discussion Settings" tier="T3" open={state.openSections.discussion} onToggle={() => dispatch({ type: "TOGGLE_SECTION", key: "discussion" })}>
        <div className="toggle-row">
          <span className="toggle-lbl">Enable Q&amp;A section</span>
          <Toggle checked={state.qaEnabled} onChange={(v) => set("qaEnabled", v)} />
        </div>
        <div className="toggle-row">
          <span className="toggle-lbl">Enable FAQ schema</span>
          <Toggle checked={state.faqSchemaEnabled} onChange={(v) => set("faqSchemaEnabled", v)} />
        </div>
        <div>
          <div className="f-lbl" style={{ marginBottom: 6 }}>Moderation Mode</div>
          <div className="mode-row">
            {["auto", "manual", "off"].map((mode) => (
              <button key={mode} className={`mode-btn ${state.moderationMode === mode ? "on" : ""}`} onClick={() => set("moderationMode", mode)}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Advanced T3 */}
      <Section title="Advanced / Accessibility" tier="T3" open={state.openSections.advanced} onToggle={() => dispatch({ type: "TOGGLE_SECTION", key: "advanced" })}>
        <div className="toggle-row">
          <span className="toggle-lbl">Semantic search index</span>
          <Toggle checked={state.semanticIndexEnabled} onChange={(v) => set("semanticIndexEnabled", v)} />
        </div>
        <div className="toggle-row">
          <span className="toggle-lbl">Include in salary hub</span>
          <Toggle checked={state.salaryHubEnabled} onChange={(v) => set("salaryHubEnabled", v)} />
        </div>
        <div className="toggle-row">
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
      </Section>

      {/* Danger Zone / Status Management */}
      {state.editingPostId && state.status === "Published" && (
        <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button 
            className="revert-draft-btn"
            onClick={() => {
              const post = state.allPosts.find(p => p.id === state.editingPostId);
              if (post) set('statusConfirmPost', post);
            }}
          >
            Move to Draft (Unpublish)
          </button>
          <p style={{ fontSize: 10, color: "var(--text4)", marginTop: 8, textAlign: 'center', lineHeight: 1.4 }}>
            Removes the post from public blog and returns it to drafts.
          </p>
        </div>
      )}
    </>
  );
}
