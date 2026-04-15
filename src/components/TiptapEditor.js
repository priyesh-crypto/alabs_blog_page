"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapImage from '@tiptap/extension-image';
import { TextStyle, FontFamily } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import './TiptapEditor.css';
import { ImageIcon, Video, Code, Plus, MessageSquare, HelpCircle, Mail, LayoutGrid, GraduationCap, Table2 } from 'lucide-react';
import { CommentMark } from './studio/CommentMark';
import TiptapComments from './studio/TiptapComments';

// ── Custom Video Node ────────────────────────────────────────
const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      commentId: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'video[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const { commentId, ...rest } = HTMLAttributes;
    return ['video', mergeAttributes(rest, {
      controls: true,
      'data-comment-id': commentId,
      class: commentId ? 'commented-media' : '',
      style: 'max-width:100%;border-radius:12px;margin:28px 0;display:block;box-shadow: 0 4px 24px rgba(0,0,0,0.08);' + (commentId ? 'outline: 3px solid var(--blue-dim); outline-offset: 4px;' : ''),
    })];
  },
});

const CustomImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) return {};
          return {
            'data-comment-id': attributes.commentId,
            class: 'commented-media',
          };
        },
      },
    };
  },
});

// ── Shared: stop keystrokes from reaching ProseMirror ────────
const stopKey = (e) => e.stopPropagation();

// ── Shared: inline widget chrome (wrapper, delete btn, edit btn) ─
function WidgetShell({ color, isEmpty, isEditing, onEdit, onDone, onDelete, children }) {
  return (
    <NodeViewWrapper className="widget-card-node">
      <div
        contentEditable={false}
        style={{ position: "relative", outline: isEditing ? `2.5px solid ${color}` : "2px solid transparent", borderRadius: 14, outlineOffset: 2, transition: "outline 0.15s" }}
      >
        {children}
        {/* action bar */}
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 5, zIndex: 20 }}>
          {!isEditing && (
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
              title="Edit widget"
              style={{ background: "rgba(255,255,255,0.95)", border: `1px solid ${color}40`, color, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            >
              ✏ Edit
            </button>
          )}
          {isEditing && (
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onDone(); }}
              title="Collapse edit form"
              style={{ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "3px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
            >
              ✓ Done
            </button>
          )}
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            title="Remove widget"
            style={{ background: "rgba(255,255,255,0.95)", border: "1px solid #fee2e2", color: "#ef4444", borderRadius: 6, padding: "3px 7px", fontSize: 13, fontWeight: 700, cursor: "pointer", lineHeight: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          >✕</button>
        </div>
        {isEditing && (
          <div style={{ position: "absolute", top: -11, left: 12, background: color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 10, letterSpacing: "0.05em", pointerEvents: "none", zIndex: 20 }}>
            EDITING
          </div>
        )}
        {isEmpty && !isEditing && (
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 8, whiteSpace: "nowrap", pointerEvents: "none" }}>
            Click Edit to configure
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ── Quiz Widget ───────────────────────────────────────────────
function QuizWidget({ node, updateAttributes, deleteNode }) {
  const { question = "", options: rawOptions = "[]", correctIndex = 0, explanation = "" } = node.attrs;
  let options = [];
  try { options = JSON.parse(rawOptions); } catch { options = ["", "", "", ""]; }
  if (!options.length) options = ["", "", "", ""];

  const isEmpty = !question.trim() && !options.some(o => o.trim());
  const [isEditing, setIsEditing] = useState(isEmpty);

  const setOptions = (next) => updateAttributes({ options: JSON.stringify(next) });

  return (
    <WidgetShell color="#16a34a" isEmpty={isEmpty} isEditing={isEditing} onEdit={() => setIsEditing(true)} onDone={() => setIsEditing(false)} onDelete={deleteNode}>
      {isEditing ? (
        <div style={{ background: "#f0fdf4", border: "2px dashed #86efac", borderRadius: 12, padding: "20px 24px" }} onKeyDown={stopKey} onKeyUp={stopKey}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <HelpCircle size={15} color="#16a34a" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em" }}>Knowledge Check</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase" }}>Question</label>
            <textarea
              value={question}
              onChange={(e) => updateAttributes({ question: e.target.value })}
              onKeyDown={stopKey} onKeyUp={stopKey}
              placeholder="What is your question?"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #86efac", fontSize: 13, resize: "vertical", minHeight: 52, background: "#fff", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase" }}>Options <span style={{ fontWeight: 400, textTransform: "none", color: "#6b7280" }}>— click ✓ to mark correct</span></label>
            {options.map((opt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <button
                  onMouseDown={(e) => { e.preventDefault(); updateAttributes({ correctIndex: i }); }}
                  style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${correctIndex === i ? "#16a34a" : "#d1d5db"}`, background: correctIndex === i ? "#16a34a" : "#fff", color: "#fff", flexShrink: 0, cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
                >{correctIndex === i ? "✓" : ""}</button>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => { const next = [...options]; next[i] = e.target.value; setOptions(next); }}
                  onKeyDown={stopKey} onKeyUp={stopKey}
                  placeholder={`Option ${i + 1}`}
                  style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: `1px solid ${correctIndex === i ? "#86efac" : "#d1d5db"}`, fontSize: 13, background: correctIndex === i ? "#dcfce7" : "#fff", outline: "none" }}
                />
              </div>
            ))}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase" }}>Explanation <span style={{ fontWeight: 400, textTransform: "none", color: "#6b7280" }}>shown after answering</span></label>
            <textarea
              value={explanation}
              onChange={(e) => updateAttributes({ explanation: e.target.value })}
              onKeyDown={stopKey} onKeyUp={stopKey}
              placeholder="Brief explanation of the correct answer…"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #86efac", fontSize: 13, resize: "vertical", minHeight: 44, background: "#fff", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
      ) : (
        /* Preview */
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "20px 24px", userSelect: "none" }}>
          {isEmpty ? (
            <div className="widget-empty-state">
              <div className="widget-empty-state-icon"><HelpCircle size={26} color="#86efac" /></div>
              <div className="widget-empty-state-text" style={{ color: "#16a34a" }}>⚡ Quiz Block — click Edit to configure</div>
            </div>
          ) : (
            <>
              <div style={{ background: "#16a34a", display: "inline-block", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", marginBottom: 12 }}>KNOWLEDGE CHECK</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#14532d", marginBottom: 14, lineHeight: 1.4 }}>{question}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {options.map((opt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: i === correctIndex ? "#dcfce7" : "#fff", border: `1px solid ${i === correctIndex ? "#86efac" : "#e2e8f0"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#1e293b" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${i === correctIndex ? "#16a34a" : "#cbd5e1"}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {i === correctIndex && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />}
                    </div>
                    {opt || `Option ${i + 1}`}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </WidgetShell>
  );
}

// ── Newsletter Widget ─────────────────────────────────────────
function NewsletterWidget({ node, updateAttributes, deleteNode }) {
  const { headline = "", subtext = "", ctaLabel = "", actionUrl = "" } = node.attrs;
  const isEmpty = !headline.trim() && !subtext.trim();
  const [isEditing, setIsEditing] = useState(isEmpty);

  return (
    <WidgetShell color="#003b93" isEmpty={isEmpty} isEditing={isEditing} onEdit={() => setIsEditing(true)} onDone={() => setIsEditing(false)} onDelete={deleteNode}>
      {isEditing ? (
        <div style={{ background: "#eff6ff", border: "2px dashed #93c5fd", borderRadius: 12, padding: "20px 24px" }} onKeyDown={stopKey} onKeyUp={stopKey}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Mail size={15} color="#003b93" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#003b93", textTransform: "uppercase", letterSpacing: "0.06em" }}>Newsletter CTA</span>
          </div>
          {[
            { key: "headline",  label: "Headline",        placeholder: "Get the Data Science Career Guide" },
            { key: "subtext",   label: "Subtext",         placeholder: "Join 40,000+ learners. Download our free PDF…", multi: true },
            { key: "ctaLabel",  label: "Button label",    placeholder: "Subscribe →" },
            { key: "actionUrl", label: "Destination URL", placeholder: "https://analytixlabs.co.in/…" },
          ].map(({ key, label, placeholder, multi }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase" }}>{label}</label>
              {multi ? (
                <textarea value={node.attrs[key]} onChange={(e) => updateAttributes({ [key]: e.target.value })} onKeyDown={stopKey} onKeyUp={stopKey} placeholder={placeholder} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #93c5fd", fontSize: 13, resize: "vertical", minHeight: 52, background: "#fff", outline: "none", boxSizing: "border-box" }} />
              ) : (
                <input type="text" value={node.attrs[key]} onChange={(e) => updateAttributes({ [key]: e.target.value })} onKeyDown={stopKey} onKeyUp={stopKey} placeholder={placeholder} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #93c5fd", fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" }} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #003b93 0%, #0057d9 100%)", borderRadius: 12, padding: "24px 28px", color: "#fff", userSelect: "none" }}>
          {isEmpty ? (
            <div className="widget-empty-state" style={{ background: "transparent", border: "2px dashed rgba(255,255,255,0.3)" }}>
              <div className="widget-empty-state-icon"><Mail size={26} color="rgba(255,255,255,0.5)" /></div>
              <div className="widget-empty-state-text" style={{ color: "rgba(255,255,255,0.7)" }}>⚡ Newsletter CTA — click Edit to configure</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", opacity: 0.75, marginBottom: 6, textTransform: "uppercase" }}>Free Resource</div>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, marginBottom: subtext.trim() ? 6 : 16 }}>{headline}</div>
              {subtext.trim() && <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 16 }}>{subtext}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>your@email.com</div>
                {actionUrl ? (
                  <a href={actionUrl} target="_blank" rel="noopener noreferrer" style={{ background: "#fff", color: "#003b93", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>{ctaLabel || "Subscribe →"}</a>
                ) : (
                  <div style={{ background: "#fff", color: "#003b93", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{ctaLabel || "Subscribe →"}</div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </WidgetShell>
  );
}

// ── Course Match Widget ───────────────────────────────────────
function CourseMatchWidget({ node, updateAttributes, deleteNode }) {
  const { ctaHeadline = "", courseName = "", courseUrl = "" } = node.attrs;
  const isEmpty = !ctaHeadline.trim() && !courseName.trim();
  const [isEditing, setIsEditing] = useState(isEmpty);

  return (
    <WidgetShell color="#4f46e5" isEmpty={isEmpty} isEditing={isEditing} onEdit={() => setIsEditing(true)} onDone={() => setIsEditing(false)} onDelete={deleteNode}>
      {isEditing ? (
        <div style={{ background: "#eef2ff", border: "2px dashed #a5b4fc", borderRadius: 12, padding: "20px 24px" }} onKeyDown={stopKey} onKeyUp={stopKey}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <GraduationCap size={15} color="#4f46e5" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.06em" }}>Course CTA</span>
          </div>
          {[
            { key: "courseName",  label: "Course name",   placeholder: "Machine Learning with Python" },
            { key: "ctaHeadline", label: "CTA headline",  placeholder: "Ready to go deeper? Enroll now →" },
            { key: "courseUrl",   label: "Course link",   placeholder: "https://analytixlabs.co.in/…" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase" }}>{label}</label>
              <input type="text" value={node.attrs[key]} onChange={(e) => updateAttributes({ [key]: e.target.value })} onKeyDown={stopKey} onKeyUp={stopKey} placeholder={placeholder} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #a5b4fc", fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "#eef2ff", border: "1px solid #a5b4fc", borderRadius: 12, padding: "20px 24px", userSelect: "none" }}>
          {isEmpty ? (
            <div className="widget-empty-state" style={{ background: "#eef2ff", border: "2px dashed #a5b4fc" }}>
              <div className="widget-empty-state-icon"><GraduationCap size={26} color="#a5b4fc" /></div>
              <div className="widget-empty-state-text" style={{ color: "#4f46e5" }}>⚡ Course CTA — click Edit to configure</div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <GraduationCap size={22} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Recommended Course</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1e1b4b", marginBottom: 6, lineHeight: 1.3 }}>{courseName || "Your course title"}</div>
                {ctaHeadline.trim() && <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 12 }}>{ctaHeadline}</div>}
                {courseUrl ? (
                  <a href={courseUrl} target="_blank" rel="noopener noreferrer" style={{ background: "#4f46e5", color: "#fff", borderRadius: 7, padding: "8px 18px", fontSize: 13, fontWeight: 700, display: "inline-block", marginTop: ctaHeadline.trim() ? 0 : 8, textDecoration: "none" }}>Enroll Now →</a>
                ) : (
                  <div style={{ background: "#4f46e5", color: "#fff", borderRadius: 7, padding: "8px 18px", fontSize: 13, fontWeight: 700, display: "inline-block", marginTop: ctaHeadline.trim() ? 0 : 8 }}>Enroll Now →</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}

// ── Next Steps Widget ─────────────────────────────────────────
function NextStepsWidget({ node, updateAttributes, deleteNode }) {
  const rawSteps = node.attrs.steps || "[]";
  let steps = [];
  try {
    const parsed = JSON.parse(rawSteps);
    // Migrate legacy string-array format → object format
    steps = parsed.map(s => typeof s === "string" ? { text: s, url: "" } : s);
  } catch { steps = []; }
  if (!steps.length) steps = [{ text: "", url: "" }, { text: "", url: "" }, { text: "", url: "" }];

  const filledSteps = steps.filter(s => s.text?.trim());
  const isEmpty = filledSteps.length === 0;
  const [isEditing, setIsEditing] = useState(isEmpty);

  const setSteps = (next) => updateAttributes({ steps: JSON.stringify(next) });
  const updateStep = (i, field, value) => {
    const next = steps.map((s, idx) => idx === i ? { ...s, [field]: value } : s);
    setSteps(next);
  };

  return (
    <WidgetShell color="#b45309" isEmpty={isEmpty} isEditing={isEditing} onEdit={() => setIsEditing(true)} onDone={() => setIsEditing(false)} onDelete={deleteNode}>
      {isEditing ? (
        <div style={{ background: "#fffbeb", border: "2px dashed #fcd34d", borderRadius: 12, padding: "20px 24px" }} onKeyDown={stopKey} onKeyUp={stopKey}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <LayoutGrid size={15} color="#b45309" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Next Steps</span>
          </div>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 7, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309", width: 18, flexShrink: 0, textAlign: "right", paddingTop: 9 }}>{i + 1}.</span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <input
                  type="text"
                  value={step.text}
                  onChange={(e) => updateStep(i, "text", e.target.value)}
                  onKeyDown={stopKey} onKeyUp={stopKey}
                  placeholder={`Step ${i + 1} description`}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #fcd34d", fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" }}
                />
                <input
                  type="text"
                  value={step.url}
                  onChange={(e) => updateStep(i, "url", e.target.value)}
                  onKeyDown={stopKey} onKeyUp={stopKey}
                  placeholder="Link URL (optional)"
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 12, background: "#fff", outline: "none", boxSizing: "border-box", color: "#6b7280" }}
                />
              </div>
              {steps.length > 1 && (
                <button onMouseDown={(e) => { e.preventDefault(); setSteps(steps.filter((_, j) => j !== i)); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, lineHeight: 1, paddingTop: 8, flexShrink: 0 }}>×</button>
              )}
            </div>
          ))}
          {steps.length < 6 && (
            <button onMouseDown={(e) => { e.preventDefault(); setSteps([...steps, { text: "", url: "" }]); }} style={{ fontSize: 12, color: "#b45309", background: "none", border: "1px dashed #fcd34d", borderRadius: 6, padding: "5px 12px", cursor: "pointer", marginTop: 4 }}>+ Add step</button>
          )}
        </div>
      ) : (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12, padding: "20px 24px", userSelect: "none" }}>
          {isEmpty ? (
            <div className="widget-empty-state" style={{ background: "#fffbeb", border: "2px dashed #fcd34d" }}>
              <div className="widget-empty-state-icon"><LayoutGrid size={26} color="#fcd34d" /></div>
              <div className="widget-empty-state-text" style={{ color: "#b45309" }}>⚡ AI Next Steps — click Edit to configure</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <LayoutGrid size={16} color="#b45309" />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>AI-Suggested Next Steps</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filledSteps.slice(0, 6).map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fef3c7", border: "1px solid #fcd34d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#b45309" }}>{i + 1}</div>
                    {step.url ? (
                      <a href={step.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#b45309", lineHeight: 1.4, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>{step.text}</a>
                    ) : (
                      <span style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.4 }}>{step.text}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </WidgetShell>
  );
}

// ── Widget Error Boundary ─────────────────────────────────────
class WidgetErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { crashed: false, error: null }; }
  static getDerivedStateFromError(error) { return { crashed: true, error }; }
  componentDidCatch(error, info) { console.error('[WidgetErrorBoundary]', error, info); }
  render() {
    if (this.state.crashed) {
      return (
        <NodeViewWrapper className="widget-card-node">
          <div contentEditable={false} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px 18px", margin: "1.5rem 0" }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>Widget failed to load</div>
              <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>This block contains corrupted data. Delete and re-insert it.</div>
            </div>
          </div>
        </NodeViewWrapper>
      );
    }
    return this.props.children;
  }
}

// ── Widget Node View dispatcher ───────────────────────────────
function WidgetView(props) {
  const { node } = props;
  const inner = (() => {
    switch (node.attrs.type) {
      case 'quiz':        return <QuizWidget        {...props} />;
      case 'newsletter':  return <NewsletterWidget  {...props} />;
      case 'coursematch': return <CourseMatchWidget {...props} />;
      case 'nextsteps':   return <NextStepsWidget   {...props} />;
      default: return (
        <NodeViewWrapper>
          <div contentEditable={false} style={{ background: "#f1f5f9", borderRadius: 12, padding: "16px 20px", color: "#64748b", fontSize: 13, margin: "1.5rem 0" }}>
            Unknown widget type: {node.attrs.type}
          </div>
        </NodeViewWrapper>
      );
    }
  })();
  return <WidgetErrorBoundary>{inner}</WidgetErrorBoundary>;
}

// ── Custom Widget Node ────────────────────────────────────────
const WidgetNode = Node.create({
  name: 'widget',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      type:         { default: 'quiz' },
      // Quiz
      question:     { default: '' },
      options:      { default: '["","","",""]' },
      correctIndex: { default: 0 },
      explanation:  { default: '' },
      // Newsletter
      headline:     { default: '' },
      subtext:      { default: '' },
      ctaLabel:     { default: '' },
      actionUrl:    { default: '' },
      // Course match
      courseName:   { default: '' },
      ctaHeadline:  { default: '' },
      courseUrl:    { default: '' },
      // Next steps (array of {text, url} objects)
      steps:        { default: '[{"text":"","url":""},{"text":"","url":""},{"text":"","url":""}]' },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-widget]',
        getAttrs: (dom) => {
          const type = dom.getAttribute('data-widget');
          const base = { type };
          try { return { ...base, ...JSON.parse(dom.getAttribute('data-widget-attrs') || '{}') }; }
          catch { return base; }
        },
      },
      // Backward compat: [[shortcodes]]
      {
        tag: 'p',
        getAttrs: (dom) => {
          const text = dom.textContent?.trim()?.toLowerCase();
          if (text === '[[quiz]]')        return { type: 'quiz' };
          if (text === '[[newsletter]]')  return { type: 'newsletter' };
          if (text === '[[coursematch]]') return { type: 'coursematch' };
          if (text === '[[nextsteps]]')   return { type: 'nextsteps' };
          return false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    // Serialize all non-type attrs as a JSON blob for round-trip fidelity.
    // atom: true nodes must NOT include a content hole (the trailing 0) —
    // ProseMirror throws "Content hole not allowed in a leaf node spec" if present.
    const { type, ...rest } = HTMLAttributes;
    return ['div', mergeAttributes({
      'data-widget':       type,
      'data-widget-attrs': JSON.stringify(rest),
      class: 'widget-placeholder',
    })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(WidgetView);
  },
});

const lowlight = createLowlight(common);


// ── Bubble Menu (renders on text selection) ──────────────────
function SelectionMenu({ editor, outerRef, comments, onUpdateComments, currentAuthor }) {
  const [pos, setPos] = useState(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showAltInput, setShowAltInput] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { selection } = editor.state;
      const { from, to, empty } = selection;
      
      const isNodeSelection = selection.node;
      const nodeType = isNodeSelection?.type.name;
      const isMediaSelected = nodeType === 'image' || nodeType === 'video';

      if (empty && !isMediaSelected) { setPos(null); setShowLinkInput(false); setShowAltInput(false); setShowCommentInput(false); return; }
      if (!outerRef?.current) return;

      const view = editor.view;
      const outerRect = outerRef.current.getBoundingClientRect();

      if (isMediaSelected) {
        const node = view.nodeDOM(from);
        if (node) {
          const rect = node.getBoundingClientRect();
          setPos({
            left: (rect.left + rect.right) / 2 - outerRect.left,
            top: rect.top - outerRect.top - 58,
          });
          setAltText(isNodeSelection.attrs.alt || "");
        }
      } else {
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        const desiredLeft = (start.left + end.left) / 2 - outerRect.left;
        const minLeft = 260; // Increased to 260 to accommodate wider menu translations
        const maxLeft = outerRect.width - 260;
        setPos({
          left: Math.max(minLeft, Math.min(maxLeft, desiredLeft)),
          top: start.top - outerRect.top - 52,
        });
      }
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor, outerRef]);

  if (!pos || !editor) return null;

  const isLinkActive = editor.isActive('link');

  const applyLink = () => {
    if (linkUrl.trim()) editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
  };

  const handleAddComment = () => {
    if (!commentDraft.trim() || !onUpdateComments) return;
    const commentId = Date.now().toString();
    const { selection } = editor.state;

    if (selection.node && (selection.node.type.name === 'image' || selection.node.type.name === 'video')) {
      editor.chain().focus().updateAttributes(selection.node.type.name, { commentId }).run();
    } else {
      editor.chain().focus().setComment(commentId).run();
    }
    
    // Add to state
    onUpdateComments([
      ...(comments || []),
      {
        id: commentId,
        authorName: currentAuthor?.name || "Author",
        authorAvatar: currentAuthor?.image || "/authors/default.svg",
        text: commentDraft.trim(),
        createdAt: new Date().toISOString(),
        replies: []
      }
    ]);

    setCommentDraft('');
    setShowCommentInput(false);
  };

  const applyAlt = () => {
    const { selection } = editor.state;
    if (selection.node) {
      editor.chain().focus().updateAttributes(selection.node.type.name, { alt: altText.trim() }).run();
    }
    setShowAltInput(false);
  };

  const handleAltKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); applyAlt(); }
    if (e.key === 'Escape') { setShowAltInput(false); }
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); }
    if (e.key === 'Escape') { setShowCommentInput(false); setCommentDraft(''); }
  };

  const handleLinkKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
    if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); }
  };

  return (
    <div
      ref={menuRef}
      className="bubble-menu"
      style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translateX(-50%)', zIndex: 50 }}
      onMouseDown={(e) => e.preventDefault()} // prevent editor blur on click
    >
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold"><b>B</b></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic"><i>I</i></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Strikethrough"><s>S</s></button>
      <div className="bmenu-sep" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Heading 2">H2</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} title="Heading 3">H3</button>
      <div className="bmenu-sep" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Bullet list">•</button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Numbered list">1.</button>
      <div className="bmenu-sep" />
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} title="Key Insight callout" style={{ fontSize: 11, letterSpacing: '0.02em' }}>💡 Key Insight</button>
      <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'is-active' : ''} title="Inline code">{'<>'}</button>
      <div className="bmenu-sep" />
      {isLinkActive ? (
        <button onClick={removeLink} className="is-active" title="Remove link">🔗✕</button>
      ) : (
        <button
          onClick={() => { setShowLinkInput(l => !l); setLinkUrl(editor.getAttributes('link').href || ''); }}
          title="Add link"
        >🔗</button>
      )}
      <div className="bmenu-sep" />
      <button 
        onClick={() => {
          if (showCommentInput) handleAddComment();
          else setShowCommentInput(true);
        }} 
        className={showCommentInput ? 'is-active' : ''} 
        title="Add Comment"
      >
        <MessageSquare size={14} style={{ marginBottom: -2 }} />
      </button>

      {/* Media specific toggle */}
      {(editor.isActive('image') || editor.state.selection.node?.type.name === 'video') && (
        <>
          <div className="bmenu-sep" />
          <button 
            onClick={() => setShowAltInput(s => !s)} 
            className={showAltInput ? 'is-active' : ''}
            title="Edit Alt Text"
            style={{ fontSize: 11, fontWeight: 700 }}
          >
            ALT
          </button>
        </>
      )}

      {showLinkInput && !isLinkActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
          <input
            autoFocus
            type="text"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder="https://…"
            style={{ 
              background: 'var(--bg2)', 
              color: 'var(--text)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              padding: '4px 8px', 
              fontSize: 12, 
              width: 170, 
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
          <button onClick={applyLink} title="Apply" style={{ fontSize: 13, color: 'var(--green)' }}>✓</button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} title="Cancel" style={{ fontSize: 13, color: 'var(--text4)' }}>✕</button>
        </div>
      )}

      {showCommentInput && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
          <input
            autoFocus
            type="text"
            value={commentDraft}
            onChange={e => setCommentDraft(e.target.value)}
            onKeyDown={handleCommentKeyDown}
            placeholder="Type your comment..."
            style={{ 
              background: 'var(--bg2)', 
              color: 'var(--text)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              padding: '4px 8px', 
              fontSize: 12, 
              width: 180, 
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
          <button onClick={handleAddComment} title="Post" style={{ fontSize: 13, color: 'var(--green)' }}>✓</button>
          <button onClick={() => { setShowCommentInput(false); setCommentDraft(''); }} title="Cancel" style={{ fontSize: 13, color: 'var(--text4)' }}>✕</button>
        </div>
      )}

      {showAltInput && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
          <input
            autoFocus
            type="text"
            value={altText}
            onChange={e => setAltText(e.target.value)}
            onKeyDown={handleAltKeyDown}
            placeholder="Add alt text..."
            style={{ 
              background: 'var(--bg2)', 
              color: 'var(--text)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              padding: '4px 8px', 
              fontSize: 12, 
              width: 170, 
              outline: 'none'
            }}
          />
          <button onClick={applyAlt} title="Apply" style={{ fontSize: 13, color: 'var(--green)' }}>✓</button>
          <button onClick={() => setShowAltInput(false)} title="Cancel" style={{ fontSize: 13, color: 'var(--text4)' }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Plus Menu (renders on empty line focus) ──────────────────
function PlusMenu({ editor, outerRef }) {
  const [pos, setPos] = useState(null);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false); // stable ref to avoid stale closure in editor events
  const imageFileRef = useRef(null);
  const videoFileRef = useRef(null);
  const menuRef = useRef(null);

  // Keep openRef in sync
  useEffect(() => { openRef.current = open; }, [open]);

  // Close when clicking outside the menu
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      // Don't update position while dropdown is open — prevents menu unmounting before click registers
      if (openRef.current) return;

      const { $from, empty } = editor.state.selection;
      if (!empty) { setPos(null); return; }

      const node = $from.parent;
      const isEmpty = node.textContent === '';
      const isNotTitle = node.type.name !== 'heading' || $from.depth > 1;

      if (isEmpty && isNotTitle) {
        if (!outerRef?.current) return;
        const view = editor.view;
        const coords = view.coordsAtPos($from.pos);
        const outerRect = outerRef.current.getBoundingClientRect();
        
        // The tiptap-outer container has padding-left of 64px or 80px.
        // A fixed left of 16px is guaranteed to be completely visible and 
        // ~48px-64px to the left of the active text cursor.
        setPos({ 
          top: coords.top - outerRect.top - 4,
          left: 16
        });
      } else {
        setPos(null);
      }
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor, outerRef]);

  // ── Image upload ────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
      else alert('Upload failed: ' + (data.error || 'unknown'));
    } catch { alert('Image upload failed. Please try again.'); }
    e.target.value = '';
    setOpen(false);
  };

  // ── Video upload ─────────────────────────────────────────────
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        editor.chain().focus().insertContent({ type: 'video', attrs: { src: data.url } }).run();
      } else alert('Upload failed: ' + (data.error || 'unknown'));
    } catch { alert('Video upload failed. Please try again.'); }
    e.target.value = '';
    setOpen(false);
  };

  if (!pos || !editor) return null;

  return (
    <div
      ref={menuRef}
      className="floating-menu"
      style={{ position: 'absolute', left: pos.left, top: pos.top - 17, zIndex: 100 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Hidden file inputs */}
      <input ref={imageFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
      <input ref={videoFileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} />

      {/* + toggle button */}
      <button
        className={`floating-menu-btn-primary ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Insert block"
      >
        <Plus size={18} strokeWidth={2} />
      </button>

      {/* Dropdown panel — appears below the + button */}
      {open && (
        <div className="floating-options-dropdown">
          <button onClick={() => imageFileRef.current?.click()} className="fod-btn">
            <ImageIcon size={15} strokeWidth={1.5} />
            <span>Image</span>
          </button>
          <button onClick={() => videoFileRef.current?.click()} className="fod-btn">
            <Video size={15} strokeWidth={1.5} />
            <span>Video</span>
          </button>
          <button
            onClick={() => { editor.chain().focus().toggleCodeBlock().run(); setOpen(false); }}
            className="fod-btn"
          >
            <Code size={15} strokeWidth={1.5} />
            <span>Code block</span>
          </button>
          <button
            onClick={() => { editor.chain().focus().toggleBlockquote().run(); setOpen(false); }}
            className="fod-btn"
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>💡</span>
            <span>Key Insight</span>
          </button>
          <div className="fod-sep" />
          <button
            onClick={() => { editor.chain().focus().setHorizontalRule().run(); setOpen(false); }}
            className="fod-btn"
          >
            <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>—</span>
            <span>Divider</span>
          </button>
          <div className="fod-sep" />
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Widgets</div>
          {[
            { wtype: 'quiz',        label: 'Insert Quiz',       icon: <HelpCircle  size={15} strokeWidth={1.5} className="text-green-500"  /> },
            { wtype: 'newsletter',  label: 'Insert Newsletter',  icon: <Mail        size={15} strokeWidth={1.5} className="text-blue-500"   /> },
            { wtype: 'coursematch', label: 'Insert Course CTA',  icon: <GraduationCap size={15} strokeWidth={1.5} className="text-indigo-500" /> },
            { wtype: 'nextsteps',   label: 'Insert Next Steps',  icon: <LayoutGrid  size={15} strokeWidth={1.5} className="text-amber-500"  /> },
          ].map(({ wtype, label, icon }) => (
            <button
              key={wtype}
              className="fod-btn"
              onClick={() => {
                editor.chain().focus().insertContent({ type: 'widget', attrs: { type: wtype } }).run();
                setOpen(false);
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Editor ──────────────────────────────────────────────
import { forwardRef, useImperativeHandle } from 'react';

const TiptapEditor = forwardRef(function TiptapEditor({ content, onChange, onStateChange, editorComments, onUpdateComments, currentAuthor }, ref) {
  const outerRef = useRef(null);
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  // ── HTML Source Mode ─────────────────────────────────────────
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState('');

  const enterHtmlMode = useCallback(() => {
    if (!editor) return;
    setRawHtml(editor.getHTML());
    setHtmlMode(true);
  }, [editor]);

  const applyHtml = useCallback(() => {
    if (!editor) return;
    editor.commands.setContent(rawHtml, true);
    onChange && onChange(rawHtml);
    setHtmlMode(false);
  }, [editor, rawHtml, onChange]);

  const cancelHtml = useCallback(() => {
    setHtmlMode(false);
  }, []);

  const syncToolbarState = useCallback((editor) => {
    if (!onStateChangeRef.current) return;
    onStateChangeRef.current({
      bold:       editor.isActive('bold'),
      italic:     editor.isActive('italic'),
      underline:  editor.isActive('underline'),
      strike:     editor.isActive('strike'),
      h2:         editor.isActive('heading', { level: 2 }),
      h3:         editor.isActive('heading', { level: 3 }),
      bullet:     editor.isActive('bulletList'),
      ordered:    editor.isActive('orderedList'),
      fontFamily: editor.getAttributes('textStyle').fontFamily || '',
      color:      editor.getAttributes('textStyle').color || '',
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Placeholder.configure({ placeholder: 'Tell your story…' }),
      CustomImage.configure({ inline: false, allowBase64: true }),
      VideoNode,
      WidgetNode,
      CodeBlockLowlight.configure({ lowlight }),
      CommentMark,
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      Color.configure({ types: ['textStyle'] }),
      Underline,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || '<p></p>',
    immediatelyRender: false,
    onUpdate:          ({ editor }) => { onChange && onChange(editor.getHTML()); syncToolbarState(editor); },
    onSelectionUpdate: ({ editor }) => syncToolbarState(editor),
  });

  // Expose the editor instance so parent can call commands from toolbar
  useImperativeHandle(ref, () => editor, [editor]);

  return (
    <div ref={outerRef} className="tiptap-outer" style={{ position: 'relative' }}>
      <SelectionMenu editor={editor} outerRef={outerRef} comments={editorComments} onUpdateComments={onUpdateComments} currentAuthor={currentAuthor} />
      <PlusMenu editor={editor} outerRef={outerRef} />
      <div className="tiptap-prose">
        <EditorContent editor={editor} />
      </div>
      <TiptapComments
        editor={editor}
        outerRef={outerRef}
        comments={editorComments}
        onUpdateComments={onUpdateComments}
        currentAuthor={currentAuthor}
      />
    </div>
  );
});

export default TiptapEditor;
