"use client";

import { useState } from "react";

export default function VersionHistoryModal({ versions, onClose, onRestore, onPreview, preview, loading }) {
  const [restoreConfirm, setRestoreConfirm] = useState(null);

  return (
    <div className="sched-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="vh-modal">
        <div className="vh-header">
          <div>
            <div className="sched-title">Version History</div>
            <div className="sched-sub">{versions.length} revision{versions.length !== 1 ? "s" : ""} saved</div>
          </div>
          <button className="share-close" onClick={onClose}>✕</button>
        </div>

        {versions.length === 0 ? (
          <div className="vh-empty">
            <div className="vh-empty-icon">📋</div>
            <div>No versions yet. Versions are created automatically when you update a published post.</div>
          </div>
        ) : (
          <div className="vh-list">
            {versions.map((v) => (
              <div key={v.id} className={`vh-item ${preview?.id === v.id ? "active" : ""}`}>
                <div className="vh-item-head">
                  <div className="vh-version">v{v.versionNumber}</div>
                  <div className="vh-item-meta">
                    <div className="vh-item-title">{v.title || "Untitled"}</div>
                    <div className="vh-item-time">
                      {new Date(v.createdAt).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {v.updatedBy && <span> · {v.updatedBy}</span>}
                    </div>
                  </div>
                </div>
                <div className="vh-item-actions">
                  <button
                    className="vh-preview-btn"
                    onClick={() => onPreview(preview?.id === v.id ? null : v)}
                  >
                    {preview?.id === v.id ? "Hide" : "Preview"}
                  </button>
                  {restoreConfirm === v.id ? (
                    <div className="vh-restore-confirm">
                      <span className="vh-restore-warn">Restore v{v.versionNumber}?</span>
                      <button className="vh-yes" onClick={() => { onRestore(v.id); setRestoreConfirm(null); }} disabled={loading}>
                        {loading ? "…" : "Yes"}
                      </button>
                      <button className="vh-no" onClick={() => setRestoreConfirm(null)}>No</button>
                    </div>
                  ) : (
                    <button className="vh-restore-btn" onClick={() => setRestoreConfirm(v.id)}>
                      Restore
                    </button>
                  )}
                </div>

                {/* Preview content */}
                {preview?.id === v.id && (
                  <div className="vh-preview-content">
                    <div className="vh-preview-meta">
                      <span><b>Category:</b> {v.category}</span>
                      <span><b>Skill:</b> {v.skill_level}</span>
                    </div>
                    {v.excerpt && (
                      <div className="vh-preview-excerpt">
                        <b>Excerpt:</b> {v.excerpt}
                      </div>
                    )}
                    <div className="vh-preview-body tiptap-prose" dangerouslySetInnerHTML={{ __html: v.content || "<p>No content</p>" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
