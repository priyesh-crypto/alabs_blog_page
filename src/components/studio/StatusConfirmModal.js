"use client";

export default function StatusConfirmModal({ post, onConfirm, onClose, loading }) {
  const isPublished = post?.status === "Published";
  const newStatus = isPublished ? "Draft" : "Published";

  return (
    <div className="sched-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sched-modal">
        <div className="sched-title">
          {isPublished ? "Move to Draft?" : "Publish Post?"}
        </div>
        <div className="sched-sub">
          {isPublished
            ? "This post will no longer be visible on the public website. It will only be accessible in the admin panel."
            : "This post will be published and visible to all visitors on the public website."}
        </div>

        <div className="status-confirm-card">
          <div className="status-confirm-title">{post?.title || "Untitled"}</div>
          <div className="status-confirm-meta">
            <span className={`status-badge ${isPublished ? "s-published" : "s-draft"}`}>{post?.status}</span>
            <span className="status-arrow">→</span>
            <span className={`status-badge ${isPublished ? "s-draft" : "s-published"}`}>{newStatus}</span>
          </div>
        </div>

        <div className="sched-actions">
          <button className="sched-cancel" onClick={onClose}>Cancel</button>
          <button
            className={`sched-confirm ${isPublished ? "status-draft-btn" : ""}`}
            onClick={() => onConfirm(post.id)}
            disabled={loading}
          >
            {loading ? "Updating…" : isPublished ? "Move to Draft" : "Publish Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
