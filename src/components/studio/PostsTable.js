"use client";

import { useState, useMemo, useEffect } from "react";
import { I } from "./StudioIcons";

const POSTS_PER_PAGE = 25;

export default function PostsTable({ allPosts, clearEditor, loadPostForEdit, handleDeletePost, setPostsViewMode, onToggleStatus, onShowVersions }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter posts by search + status
  const filtered = useMemo(() => {
    let posts = allPosts;
    if (statusFilter !== "All") {
      posts = posts.filter((p) => (p.status || "Draft") === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      posts = posts.filter((p) => {
        const tagMatch = (p.domain_tags || []).some((t) => (t || "").toLowerCase().includes(q));
        return (
          (p.title || "").toLowerCase().includes(q) ||
          (p.slug || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.excerpt || "").toLowerCase().includes(q) ||
          (p.authorId || "").toLowerCase().includes(q) ||
          tagMatch
        );
      });
    }
    return posts;
  }, [allPosts, search, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * POSTS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + POSTS_PER_PAGE);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    const left = Math.max(2, safePage - 1);
    const right = Math.min(totalPages - 1, safePage + 1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const statusCounts = useMemo(() => {
    const counts = { All: allPosts.length, Published: 0, Draft: 0, Scheduled: 0 };
    for (const p of allPosts) {
      const s = p.status || "Draft";
      if (counts[s] !== undefined) counts[s]++;
    }
    return counts;
  }, [allPosts]);

  return (
    <div className="editor-pane">
      <div className="posts-view">
        <div className="posts-header">
          <span className="posts-title">
            All Posts ({allPosts.length})
            {search && (
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: "var(--text3, #999)" }}>
                — {filtered.length} match{filtered.length !== 1 ? "es" : ""} for "{search}"
              </span>
            )}
          </span>
          <button className="posts-new-btn" onClick={() => { clearEditor(); setPostsViewMode("editor"); }}>
            + NEW POST
          </button>
        </div>

        {/* Search + Status filters */}
        <div className="posts-filters" style={{ display: "flex", gap: 12, marginTop: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 320px", minWidth: 240 }}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3, #999)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts by title, slug, category, excerpt, tags, or author…"
              style={{
                width: "100%",
                padding: "9px 36px 9px 36px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                outline: "none",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                title="Clear search"
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", cursor: "pointer", padding: 4,
                  color: "var(--text3, #999)", display: "flex", alignItems: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["All", "Published", "Draft", "Scheduled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: statusFilter === s ? "var(--accent, #003b93)" : "var(--surface)",
                  color: statusFilter === s ? "#fff" : "var(--text2, #666)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {s} ({statusCounts[s] ?? 0})
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: "var(--text3)", fontSize: 13, padding: "24px 0" }}>
            {allPosts.length === 0 ? "No posts found. Create your first post!" : "No posts match your filters."}
          </p>
        ) : (
          <>
            <div className="posts-table-wrap">
              <table className="posts-table">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>Post</th>
                    <th>Title</th>
                    <th>Topic</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ width: 52, textAlign: "center" }}>Toggle</th>
                    <th style={{ width: 52, textAlign: "center" }}>History</th>
                    <th style={{ width: 36, textAlign: "center" }}>Edit</th>
                    <th style={{ width: 36, textAlign: "center" }}>View</th>
                    <th style={{ width: 36, textAlign: "center" }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => {
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
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
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

            {/* Pagination + range info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text3)" }}>
                Showing {startIdx + 1}–{Math.min(startIdx + POSTS_PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              {totalPages > 1 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setCurrentPage(safePage - 1)}
                    disabled={safePage <= 1}
                    style={pagerBtn(false, safePage <= 1)}
                  >
                    ← Prev
                  </button>
                  {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span key={`d-${i}`} style={{ padding: "6px 4px", fontSize: 12, color: "var(--text3)" }}>...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        style={pagerBtn(p === safePage, false)}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    style={pagerBtn(false, safePage >= totalPages)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function pagerBtn(active, disabled) {
  return {
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: active ? "var(--accent, #003b93)" : "var(--surface)",
    color: active ? "#fff" : disabled ? "var(--text4, #bbb)" : "var(--text2, #666)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    minWidth: 32,
    transition: "all 0.15s",
  };
}
