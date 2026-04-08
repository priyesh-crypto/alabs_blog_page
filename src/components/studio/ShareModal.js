"use client";

import { useState } from "react";

export default function ShareModal({ slug, onClose }) {
  const [emailInput, setEmailInput] = useState("");
  const [anyoneCanView, setAnyoneCanView] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([
    { id: 1, name: "Swapna (you)", initials: "SW", color: "#3b82f6", role: "owner", isYou: true },
  ]);

  const articleUrl = typeof window !== "undefined"
    ? `${window.location.origin}/article/${slug || "your-post-slug"}`
    : `/article/${slug || "your-post-slug"}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleInvite = () => {
    const emails = emailInput.split(",").map((e) => e.trim()).filter(Boolean);
    if (!emails.length) return;
    setInviting(true);
    const avatarColors = ["#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];
    const newUsers = emails.map((email, i) => ({
      id: Date.now() + i,
      name: email,
      initials: email.slice(0, 2).toUpperCase(),
      color: avatarColors[i % avatarColors.length],
      role: "can edit",
      isYou: false,
    }));
    setSharedUsers((prev) => [...prev, ...newUsers]);
    setEmailInput("");
    setInviting(false);
  };

  const changeRole = (userId, newRole) => {
    setSharedUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  };

  const removeUser = (userId) => {
    setSharedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <div className="share-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="share-modal">
        {/* Header */}
        <div className="share-header">
          <span className="share-title">Share this file</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="share-copy-link" onClick={copyLink} title="Copy link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                <path d="M6.5 9.5a3 3 0 0 0 4.243 0l2-2a3 3 0 0 0-4.243-4.243l-1 1" strokeLinecap="round" />
                <path d="M9.5 6.5a3 3 0 0 0-4.243 0l-2 2a3 3 0 0 0 4.243 4.243l1-1" strokeLinecap="round" />
              </svg>
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button className="share-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Invite row */}
        <div className="share-invite-row">
          <input
            className="share-email-input"
            type="text"
            placeholder="Add comma separated emails to invite"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleInvite(); } }}
          />
          <button
            className="share-invite-btn"
            onClick={handleInvite}
            disabled={!emailInput.trim() || inviting}
          >
            {inviting ? "…" : "Invite"}
          </button>
        </div>

        {/* Who has access */}
        <div className="share-access-label">Who has access</div>
        <div className="share-access-list">
          {/* Anyone row */}
          <div className="share-access-row">
            <div className="share-access-icon share-globe">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 2c0 0-3 2.5-3 6s3 6 3 6M8 2c0 0 3 2.5 3 6s-3 6-3 6M2 8h12" strokeLinecap="round" />
              </svg>
            </div>
            <div className="share-access-info">
              <span className="share-access-name">Anyone</span>
            </div>
            <div className="share-access-role-wrap">
              <label className="share-toggle-wrap">
                <input
                  type="checkbox"
                  checked={anyoneCanView}
                  onChange={(e) => setAnyoneCanView(e.target.checked)}
                  style={{ display: "none" }}
                />
                <span className={`share-toggle ${anyoneCanView ? "on" : ""}`} onClick={() => setAnyoneCanView((v) => !v)} />
              </label>
              <span className="share-access-perm">{anyoneCanView ? "can view" : "no access"}</span>
              <span className="share-chevron">›</span>
            </div>
          </div>

          {/* Team row */}
          <div className="share-access-row">
            <div className="share-access-icon share-team">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
                <rect x="2" y="2" width="12" height="12" rx="3" />
                <path d="M5 8h6M5 5h6M5 11h4" strokeLinecap="round" />
              </svg>
            </div>
            <div className="share-access-info">
              <span className="share-access-name">Anyone in Team project</span>
            </div>
            <div className="share-access-role-wrap">
              <span className="share-access-count">{sharedUsers.length} person{sharedUsers.length !== 1 ? "s" : ""}</span>
              <span className="share-chevron">›</span>
            </div>
          </div>

          {/* Individual users */}
          {sharedUsers.map((user) => (
            <div key={user.id} className="share-access-row">
              <div className="share-avatar" style={{ background: user.color }}>
                {user.initials}
              </div>
              <div className="share-access-info">
                <span className="share-access-name">{user.name}</span>
              </div>
              <div className="share-access-role-wrap">
                {user.isYou ? (
                  <span className="share-access-owner">owner</span>
                ) : (
                  <>
                    <select
                      className="share-role-sel"
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                    >
                      <option value="can edit">can edit</option>
                      <option value="can view">can view</option>
                      <option value="can comment">can comment</option>
                    </select>
                    <button className="share-remove-btn" onClick={() => removeUser(user.id)} title="Remove">✕</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* URL preview */}
        <div className="share-url-row">
          <span className="share-url-text">{articleUrl}</span>
        </div>
      </div>
    </div>
  );
}
