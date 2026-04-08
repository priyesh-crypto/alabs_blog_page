"use client";

import { I } from "./StudioIcons";

export default function PostsTable({ allPosts, clearEditor, loadPostForEdit, handleDeletePost, setPostsViewMode, onToggleStatus, onShowVersions }) {
  return (
    <div className="editor-pane">
      <div className="posts-view">
        <div className="posts-header">
          <span className="posts-title">All Posts</span>
          <button className="posts-new-btn" onClick={() => { clearEditor(); setPostsViewMode("editor"); }}>
            + NEW POST
          </button>
        </div>
        {allPosts.length === 0 ? (
          <p style={{ color: "var(--text3)", fontSize: 13 }}>No posts found. Create your first post!</p>
        ) : (
          <div className="posts-table-wrap">
            <table className="posts-table">
              <thead>
                <tr>
                  <th style={{ width: 72 }}>Post</th>
                  <th>Title</th>
                  <th>Topic</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ width: 52, textAlign: "center" }}>Status</th>
                  <th style={{ width: 52, textAlign: "center" }}>History</th>
                  <th style={{ width: 36, textAlign: "center" }}>Edit</th>
                  <th style={{ width: 36, textAlign: "center" }}>View</th>
                  <th style={{ width: 36, textAlign: "center" }}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {allPosts.map((p) => {
                  const statusCls = p.status === "Published" ? "s-published" : p.status === "Scheduled" ? "s-scheduled" : "s-draft";
                  return (
                    <tr key={p.id}>
                      <td>{p.image ? <img src={p.image} alt={p.altText || p.alt_text || ""} className="post-thumb" /> : <div className="post-thumb-ph" />}</td>
                      <td>
                        <div className="post-row-title">{p.title || "Untitled"}</div>
                        <div className="post-row-topic">{p.category}</div>
                      </td>
                      <td><span style={{ fontSize: 12, color: "var(--text3)" }}>{p.category}</span></td>
                      <td><span className={`status-badge ${statusCls}`}>{p.status || "Draft"}</span></td>
                      <td><span className="post-date">{p.publishedAt || p.published_at || "—"}</span></td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className={`post-status-toggle ${p.status === "Published" ? "is-pub" : "is-draft"}`}
                          onClick={() => onToggleStatus(p)}
                          title={p.status === "Published" ? "Move to Draft" : "Publish"}
                        >
                          {p.status === "Published" ? "↓ Draft" : "↑ Pub"}
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button className="post-act history" onClick={() => onShowVersions(p)} title="Version History">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                            <circle cx="8" cy="8" r="6" />
                            <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button className="post-act" onClick={() => loadPostForEdit(p)} title="Edit">{I.edit}</button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <a href={`/article/${p.slug}`} target="_blank" rel="noreferrer">
                          <button className="post-act" title="View">{I.view}</button>
                        </a>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button className="post-act del" onClick={() => handleDeletePost(p)} title="Delete">{I.trash}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
