"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import useStudioDraft from "@/hooks/useStudioDraft";
import { 
  fetchPendingCommentsAction, 
  approveCommentAction, 
  rejectCommentAction,
  batchModerateCommentsAction
} from "@/app/actions";
import { I } from "@/components/studio/StudioIcons";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StudioToast from "@/components/studio/StudioToast";

export default function CommentsModerationPage() {
  const router = useRouter();
  const { user, authorProfile, loading: authLoading, signOut } = useAuth();
  const { state: studioState, set: setStudio, fetchAllPosts, clearEditor, loadPostForEdit } = useStudioDraft();

  const [comments, setComments] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [actioning, setActioning] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Auth Handling ──────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!authorProfile?.is_super_admin) {
      router.replace("/studio");
      return;
    }
  }, [authLoading, authorProfile, router]);

  // ── Data Loading ───────────────────────────────────────────
  const load = useCallback(async () => {
    setFetching(true);
    const result = await fetchPendingCommentsAction();
    if (result.success) setComments(result.comments);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (authorProfile?.is_super_admin) {
      load();
      fetchAllPosts();
    }
  }, [authorProfile, load, fetchAllPosts]);

  const showToast = (msg, type = "ok") => setToast({ msg, type, id: Date.now() });

  // ── Multi-select Handlers ──────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === comments.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(comments.map(c => c.id)));
  };

  // ── Actions ────────────────────────────────────────────────
  async function handleApprove(id) {
    if (actioning.has(id)) return;
    setActioning(prev => new Set(prev).add(id));
    const result = await approveCommentAction(id);
    if (result.success) {
      setComments(prev => prev.filter(c => c.id !== id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      showToast("Comment approved and published.");
    } else {
      showToast(result.error || "Failed to approve", "err");
    }
    setActioning(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function handleReject(id) {
    if (actioning.has(id)) return;
    setActioning(prev => new Set(prev).add(id));
    const result = await rejectCommentAction(id);
    if (result.success) {
      setComments(prev => prev.filter(c => c.id !== id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      showToast("Comment rejected and deleted.");
    } else {
      showToast(result.error || "Failed to reject", "err");
    }
    setActioning(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function handleBatchAction(action) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    
    setFetching(true);
    const result = await batchModerateCommentsAction(ids, action);
    if (result.success) {
      setComments(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      showToast(`Successfully ${action === 'approve' ? 'approved' : 'rejected'} ${ids.length} comments.`);
    } else {
      showToast(result.error || `Batch ${action} failed`, "err");
    }
    setFetching(false);
  }

  // ── Derived View Props ──────────────────────────────────────
  const authorSlug = authorProfile?.slug || "al-editorial";
  const dynamicAuthor = {
    slug: authorSlug,
    name: authorProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Author",
    image: authorProfile?.image || user?.user_metadata?.avatar_url || "/authors/default.svg",
    initials: authorProfile?.initials || user?.user_metadata?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || "U",
    is_super_admin: authorProfile?.is_super_admin || false,
    email: user?.email
  };

  if (authLoading) return null;

  return (
    <div className="studio-wrapper">
      <div className="app">
        {toast && (
          <StudioToast 
            key={toast.id} 
            msg={toast.msg} 
            type={toast.type} 
            onDone={() => setToast(null)} 
          />
        )}

        {/* ── Sidebar ── */}
        <StudioSidebar
          viewMode="write"
          postsViewMode="posts"
          allPosts={studioState.allPosts}
          clearEditor={() => { clearEditor(); router.push("/studio"); }}
          loadPostForEdit={(p) => { loadPostForEdit(p); router.push("/studio"); }}
          fetchAllPosts={fetchAllPosts}
          set={setStudio}
          setMany={setStudio}
          onGoHome={() => router.push("/")}
          signOut={signOut}
          dynamicAuthor={dynamicAuthor}
        />

        {/* ── Main Area ── */}
        <main className="main">
          {/* Topbar */}
          <header className="topbar">
            <span className="tb-crumb">
              Studio&nbsp;<span style={{ color: "var(--text4)", margin: "0 4px" }}>/</span>&nbsp;
              <span style={{ color: "var(--text)" }}>Moderation</span>
            </span>
            
            <div className="tb-title">Comment Moderation</div>

            <div className="tb-saved-wrap">
              <div className="tb-saved-dot" style={{ background: fetching ? "var(--orange)" : "var(--green)" }} />
              {fetching ? "Refreshing..." : "All Caught Up"}
            </div>

            <button className="tb-ghost" onClick={load} disabled={fetching}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>

            <div className="tb-profile" onClick={() => router.push('/studio/settings')}>
              <div className="tb-avatar-circle">
                {dynamicAuthor?.image ? (
                  <img src={dynamicAuthor.image} alt="" />
                ) : (
                  dynamicAuthor?.initials
                )}
              </div>
            </div>
          </header>

          <div className="workspace" style={{ background: "var(--bg2)", padding: "32px 40px", overflowY: "auto", display: "block" }}>
            
            {/* Action Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: 0, letter-spacing: "-0.5px" }}>
                  Pending Review
                </h2>
                <p style={{ color: "var(--text3)", fontSize: 13, margin: "4px 0 0" }}>
                  {comments.length} comments awaiting publication
                </p>
              </div>

              {comments.length > 0 && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button 
                    className="tb-ghost" 
                    onClick={selectAll}
                    style={{ background: selectedIds.size > 0 ? "var(--blue-dim)" : "var(--bg2)", color: selectedIds.size > 0 ? "var(--blue)" : "var(--text2)" }}
                  >
                    {selectedIds.size === comments.length ? "Deselect All" : `Select All (${comments.length})`}
                  </button>
                  {selectedIds.size > 0 && (
                    <>
                      <button 
                        className="tb-share" 
                        onClick={() => handleBatchAction('approve')}
                        style={{ background: "var(--green)", color: "white", borderColor: "var(--green)" }}
                      >
                         Approve Selected ({selectedIds.size})
                      </button>
                      <button 
                        className="tb-ghost" 
                        onClick={() => handleBatchAction('reject')}
                        style={{ color: "var(--red)", border: "1px solid var(--red-dim)" }}
                      >
                         Reject Selected
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Empty State */}
            {comments.length === 0 && !fetching && (
              <div className="glass-chip" style={{ 
                padding: "80px 40px", textAlign: "center", borderRadius: 24,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 20
              }}>
                <div style={{ 
                  width: 64, height: 64, borderRadius: 20, background: "var(--bg3)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text4)"
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>chat_bubble</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, color: "var(--text)", fontSize: 18 }}>Inbox Zero</h3>
                  <p style={{ margin: "4px 0 0", color: "var(--text3)", fontSize: 14 }}>No pending comments to moderate. You're all caught up!</p>
                </div>
                <button className="tb-ghost" onClick={() => router.push("/studio")}>Return to Dashboard</button>
              </div>
            )}

            {/* Comment List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {comments.map((c) => {
                const isSelected = selectedIds.has(c.id);
                const isBusy = actioning.has(c.id);
                const isReply = !!c.parentCommentId;

                return (
                  <div 
                    key={c.id} 
                    className={`glass-chip ambient-shadow ${isSelected ? 'selected' : ''}`}
                    style={{ 
                      padding: 0, borderRadius: 16, border: isSelected ? "2px solid var(--blue)" : "1px solid var(--border)",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      overflow: "hidden", position: "relative",
                      opacity: isBusy ? 0.6 : 1,
                      background: "var(--bg)"
                    }}
                  >
                    {/* Selection Overlay */}
                    <div 
                      onClick={() => toggleSelect(c.id)}
                      style={{ 
                        position: "absolute", left: 0, top: 0, bottom: 0, width: 48, 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", borderRight: "1px solid var(--border)",
                        background: isSelected ? "var(--blue-dim)" : "transparent"
                      }}
                    >
                      <div style={{ 
                        width: 18, height: 18, borderRadius: 4, border: "2px solid var(--border2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isSelected ? "var(--blue)" : "transparent",
                        borderColor: isSelected ? "var(--blue)" : "var(--border2)"
                      }}>
                        {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </div>

                    <div style={{ padding: "20px 24px 20px 68px" }}>
                      {/* Context / Breadcrumb for Comment */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ 
                            fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em",
                            padding: "4px 8px", borderRadius: 6,
                            background: isReply ? "var(--orange-dim)" : "var(--blue-dim)",
                            color: isReply ? "var(--orange)" : "var(--blue)"
                          }}>
                            {isReply ? "Reply" : "Top Level Comment"}
                          </span>
                          <span style={{ color: "var(--text4)", fontSize: 13 }}>on</span>
                          <a href={`/article/${c.postSlug}`} target="_blank" style={{ color: "var(--text2)", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                            {c.postSlug}
                          </a>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text3)" }}>{c.time}</span>
                      </div>

                      {/* Parent Context if Reply */}
                      {isReply && c.parentContext && (
                        <div style={{ 
                          background: "var(--bg3)", padding: "12px 16px", borderRadius: 12, marginBottom: 16,
                          borderLeft: "3px solid var(--orange)", fontSize: 13
                        }}>
                          <div style={{ fontWeight: 700, color: "var(--text2)", marginBottom: 4, fontSize: 11, textTransform: "uppercase" }}>
                            Replying to {c.parentContext.user}
                          </div>
                          <div style={{ color: "var(--text3)", fontStyle: "italic", lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            "{c.parentContext.text}"
                          </div>
                        </div>
                      )}

                      {/* Author & Text */}
                      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                        <div style={{ 
                          width: 40, height: 40, borderRadius: 10, background: "var(--primary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontWeight: 700, flexShrink: 0
                        }}>
                          {c.user?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 15, marginBottom: 4 }}>{c.user}</div>
                          <p style={{ margin: 0, color: "var(--text2)", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                            {c.text}
                          </p>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                        <button 
                          className="tb-ghost" 
                          onClick={() => handleReject(c.id)}
                          disabled={isBusy}
                          style={{ color: "var(--red)", border: "none", fontSize: 13 }}
                        >
                           Reject & Trash
                        </button>
                        <button 
                          className="tb-ghost" 
                          onClick={() => handleApprove(c.id)}
                          disabled={isBusy}
                          style={{ background: "var(--green-dim)", color: "var(--green)", border: "none", padding: "8px 16px", fontSize: 13, fontWeight: 700 }}
                        >
                           Approve Comment
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </main>
      </div>

      <style jsx>{`
        .glass-chip {
          background: var(--bg);
          border: 1px solid var(--border);
          backdrop-filter: blur(8px);
        }
        .ambient-shadow {
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .glass-chip:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          border-color: var(--border2);
        }
        .glass-chip.selected {
          border-color: var(--blue) !important;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.12) !important;
        }
      `}</style>
    </div>
  );
}
