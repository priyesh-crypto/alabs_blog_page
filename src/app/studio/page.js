"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  publishPostAction, schedulePostAction, updatePostAction, deletePostAction,
  togglePostStatusAction, fetchVersionsAction, restoreVersionAction,
} from "@/app/actions";
import TiptapEditor from "@/components/TiptapEditor";
import useStudioDraft, { buildPublishPayload } from "@/hooks/useStudioDraft";
import { useAuth } from "@/hooks/useAuth";

// Studio sub-components
import StudioToast from "@/components/studio/StudioToast";
import ScheduleModal from "@/components/studio/ScheduleModal";
import ShareModal from "@/components/studio/ShareModal";
import StatusConfirmModal from "@/components/studio/StatusConfirmModal";
import VersionHistoryModal from "@/components/studio/VersionHistoryModal";
import StudioSidebar from "@/components/studio/StudioSidebar";
import EditorToolbar from "@/components/studio/EditorToolbar";
import PreviewPane from "@/components/studio/PreviewPane";
import PostsTable from "@/components/studio/PostsTable";
import DetailsPanel from "@/components/studio/DetailsPanel";
import SeoPanel from "@/components/studio/SeoPanel";
import AdvancedPanel from "@/components/studio/AdvancedPanel";
import { I } from "@/components/studio/StudioIcons";

export default function AuthorStudio() {
  const router = useRouter();
  const { user, authorProfile, signOut } = useAuth();
  const editorRef = useRef(null);

  const {
    state,
    set,
    setMany,
    dispatch,
    showToast,
    fetchAllPosts,
    clearEditor,
    loadPostForEdit,
    saveDraftManually,
    restoreDraft,
    discardDraft,
    clearDraftOnSuccess,
  } = useStudioDraft();

  // ── Derived State ────────────────────────────────────────
  // authorProfile.slug is the FK used in posts.author_id — never use user.id (UUID)
  const authorSlug = authorProfile?.slug || "al-editorial";
  const dynamicAuthor = {
    slug: authorSlug,
    name: authorProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Author",
    image: authorProfile?.image || user?.user_metadata?.avatar_url || "/authors/default.png",
    initials: authorProfile?.initials || user?.user_metadata?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || "U",
    is_super_admin: authorProfile?.is_super_admin || false,
    email: user?.email
  };

  // ── Actions ──────────────────────────────────────────────
  const publishPost = async () => {
    if (!state.postTitle.trim()) return showToast("Please enter a title", "err");
    set("isPublishing", true);
    const payload = buildPublishPayload(state, authorSlug);
    const res = await publishPostAction(payload);
    if (res.success) {
      clearDraftOnSuccess();
      showToast("Post published successfully!");
      fetchAllPosts();
      setMany({ postsViewMode: "posts", isPublishing: false });
    } else { showToast(res.error || "Failed to publish", "err"); set("isPublishing", false); }
  };

  const schedulePost = async (date) => {
    set("isPublishing", true);
    const payload = buildPublishPayload(state, authorSlug);
    const res = await schedulePostAction(payload, date);
    if (res.success) {
      clearDraftOnSuccess();
      showToast("Post scheduled!");
      fetchAllPosts();
      setMany({ postsViewMode: "posts", isPublishing: false, showScheduleModal: false });
    } else { showToast(res.error || "Failed to schedule", "err"); set("isPublishing", false); }
  };

  const updatePost = async () => {
    set("isPublishing", true);
    const payload = buildPublishPayload(state, authorSlug);
    const res = await updatePostAction(state.editingPostId, payload);
    if (res.success) {
      clearDraftOnSuccess();
      showToast("Post updated!");
      fetchAllPosts();
      set("isPublishing", false);
    } else { showToast(res.error || "Update failed", "err"); set("isPublishing", false); }
  };

  const handleDeletePost = async (post) => {
    if (!confirm(`Delete "${post.title || "Untitled"}"?`)) return;
    const res = await deletePostAction(post.id);
    if (res.success) {
      showToast("Deleted.");
      fetchAllPosts();
      if (state.editingPostId === post.id) clearEditor();
    } else showToast("Delete failed", "err");
  };

  const handleToggleStatusConfirm = async () => {
    const post = state.statusConfirmPost;
    if (!post) return;
    set("isPublishing", true);
    const nextStatus = post.status === "Published" ? "Draft" : "Published";
    const res = await togglePostStatusAction(post.id);
    if (res.success) {
      showToast(`Post moved to ${nextStatus}`);
      fetchAllPosts();
      if (state.editingPostId === post.id) set("status", nextStatus);
      setMany({ statusConfirmPost: null, isPublishing: false });
    } else { showToast("Status update failed", "err"); set("isPublishing", false); }
  };

  const handleBodyChange = useCallback((html) => {
    setMany({ postBody: html, isSaved: false, saveStatus: "Saving..." });
  }, [setMany]);

  const handleEditorStateChange = useCallback((tbSnapshot) => {
    set("tbState", tbSnapshot);
  }, [set]);

  const cmd = useCallback((cb) => {
    if (editorRef.current) {
      cb(editorRef.current);
    }
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

  // ── Version History ──────────────────────────────────────
  const handleShowVersions = useCallback(async (post) => {
    const res = await fetchVersionsAction(post.id);
    setMany({
      showVersionHistory: true,
      versions: res.versions || [],
      versionPreview: null,
      editingPostId: post.id,
    });
  }, [setMany]);

  const handleRestoreVersion = useCallback(async (versionId) => {
    setMany({ isPublishing: true });
    const res = await restoreVersionAction(state.editingPostId, versionId);
    if (res.success) {
      showToast(`Restored to v${res.restoredVersion}`);
      fetchAllPosts();
      // Refresh version list
      const vRes = await fetchVersionsAction(state.editingPostId);
      setMany({
        versions: vRes.versions || [],
        versionPreview: null,
        isPublishing: false,
      });
    } else { showToast("Restore failed: " + res.error, "err"); set("isPublishing", false); }
  }, [state.editingPostId, setMany, showToast, fetchAllPosts, set]);

  // ══════════════════════════════════════════════════════════
  return (
    <div className="studio-wrapper">
      <div className="app">

        {/* Toast */}
        {state.toast && (
          <StudioToast key={state.toast.id} msg={state.toast.msg} type={state.toast.type} onDone={() => set("toast", null)} />
        )}

        {/* Modals */}
        {state.showScheduleModal && (
          <ScheduleModal
            onConfirm={schedulePost}
            onClose={() => set("showScheduleModal", false)}
            loading={state.isPublishing}
          />
        )}
        {state.statusConfirmPost && (
          <StatusConfirmModal
            post={state.statusConfirmPost}
            onConfirm={handleToggleStatusConfirm}
            onClose={() => set("statusConfirmPost", null)}
            loading={state.isPublishing}
          />
        )}
        {state.showShareModal && (
          <ShareModal
            slug={state.slug}
            onClose={() => set("showShareModal", false)}
            currentAuthor={dynamicAuthor}
          />
        )}
        {state.showVersionHistory && (
          <VersionHistoryModal
            versions={state.versions}
            preview={state.versionPreview}
            onClose={() => setMany({ showVersionHistory: false, versionPreview: null })}
            onRestore={handleRestoreVersion}
            onPreview={(v) => set("versionPreview", v)}
            loading={state.isPublishing}
          />
        )}

        {/* ═══════ LEFT SIDEBAR ═══════ */}
        <StudioSidebar
          viewMode={state.viewMode}
          postsViewMode={state.postsViewMode}
          allPosts={state.allPosts}
          clearEditor={clearEditor}
          loadPostForEdit={loadPostForEdit}
          fetchAllPosts={fetchAllPosts}
          set={set}
          setMany={setMany}
          onGoHome={() => router.push("/")}
          signOut={signOut}
          dynamicAuthor={dynamicAuthor}
        />

        {/* ═══════ MAIN AREA ═══════ */}
        <div className="main">

          {/* ── Top Bar ── */}
          <header className="topbar">
            <span className="tb-crumb">Article&nbsp;<span style={{ color: "var(--text4)", margin: "0 4px" }}>/</span></span>
            <input className="tb-title" value={state.postTitle} placeholder="Enter article title..." readOnly />
            <div className="tb-saved-wrap">
              <div className="tb-saved-dot" style={{ background: state.isSaved ? "var(--green)" : "var(--orange)" }} />
              {state.saveStatus}
            </div>
            <button className="tb-ghost" onClick={() => { set("postsViewMode", "editor"); set("viewMode", state.viewMode === "preview" ? "write" : "preview"); }}>
              {I.play} Preview
            </button>

            {state.postsViewMode === "editor" && state.editingPostId ? (
              <button
                className="tb-btn"
                onClick={() => handleShowVersions({ id: state.editingPostId })}
                title="Version History"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" width="14" height="14" style={{ marginBottom: -1 }}>
                  <circle cx="8" cy="8" r="6.5" />
                  <path d="M8 4v4l2.5 1.5" strokeLinecap="round" />
                </svg>
                History
              </button>
            ) : (
              <button
                className="tb-ghost"
                style={{ border: "none", background: "none", color: "var(--text3)" }}
                disabled
              >
                New Post
              </button>
            )}

            <button className="tb-share" onClick={() => set("showShareModal", true)} title="Share this post">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" width="13" height="13">
                <circle cx="12" cy="3" r="1.8" /><circle cx="4" cy="8" r="1.8" /><circle cx="12" cy="13" r="1.8" />
                <path d="M5.7 7.1l4.6-2.7M5.7 8.9l4.6 2.7" strokeLinecap="round" />
              </svg>
              Share
            </button>

            <div 
              className="tb-profile" 
              onClick={() => router.push('/studio/settings')}
              title="Profile Settings"
            >
              <div className="tb-avatar-circle">
                {dynamicAuthor?.image ? (
                  <img src={dynamicAuthor.image} alt="" />
                ) : (
                  dynamicAuthor?.initials || (dynamicAuthor?.name ? dynamicAuthor.name.charAt(0).toUpperCase() : "U")
                )}
              </div>
            </div>
          </header>

          {/* ── Workspace ── */}
          <div className="workspace">

            {/* All Posts pane */}
            {state.postsViewMode === "posts" && (
              <PostsTable
                allPosts={state.allPosts}
                clearEditor={clearEditor}
                loadPostForEdit={loadPostForEdit}
                handleDeletePost={handleDeletePost}
                setPostsViewMode={(v) => set("postsViewMode", v)}
                onToggleStatus={(p) => set("statusConfirmPost", p)}
                onShowVersions={handleShowVersions}
              />
            )}

            {/* Editor / Preview pane */}
            {state.postsViewMode === "editor" && (
              <div className="editor-pane">

                {/* Draft banner */}
                {state.showDraftBanner && state.draftData && (
                  <div className="draft-banner">
                    <span className="draft-banner-text">
                      Unsaved draft from{" "}
                      {state.draftData.savedAt
                        ? new Date(state.draftData.savedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "earlier"} — restore it?
                    </span>
                    <button className="draft-restore" onClick={restoreDraft}>Restore</button>
                    <button className="draft-discard" onClick={discardDraft}>Discard</button>
                  </div>
                )}

                {/* Write mode */}
                {state.viewMode === "write" && (
                  <>
                    <EditorToolbar tbState={state.tbState} cmd={cmd} />
                    <div className="editor-scroll">
                      <TiptapEditor
                        ref={editorRef}
                        key={state.editorKey}
                        content={state.editorInitContent}
                        onChange={handleBodyChange}
                        onStateChange={handleEditorStateChange}
                        editorComments={state.editorComments}
                        onUpdateComments={(c) => set("editorComments", c)}
                        currentAuthor={dynamicAuthor}
                      />
                    </div>
                  </>
                )}

                {/* Preview mode */}
                {state.viewMode === "preview" && (
                  <PreviewPane
                    postTitle={state.postTitle}
                    postBody={state.postBody}
                    excerpt={state.excerpt}
                    category={state.category}
                    readTime={state.readTime}
                    featuredImage={state.featuredImage}
                    authorObj={dynamicAuthor}
                  />
                )}
              </div>
            )}

            {/* ═══════ RIGHT PANEL ═══════ */}
            <aside className="publish-panel">

              {/* Tabs */}
              <div className="pp-tabs">
                {["details", "seo", "advanced"].map((t) => (
                  <button key={t} className={`pp-tab ${state.activeTab === t ? "on" : ""}`} onClick={() => set("activeTab", t)}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="pp-body">
                {state.activeTab === "details" && (
                  <DetailsPanel state={state} dispatch={dispatch} set={set} showToast={showToast} />
                )}
                {state.activeTab === "seo" && (
                  <SeoPanel state={state} set={set} />
                )}
                {state.activeTab === "advanced" && (
                  <AdvancedPanel state={state} set={set} />
                )}
              </div>

              {/* ── Publish Footer ── */}
              <div className="pub-footer">
                <div className="pub-stats">
                  <span>{state.wordCount > 0 ? `${state.wordCount} WORDS STATS` : "0 WORDS STATS"}</span>
                  <span className="pub-auto">
                    <span className="pub-auto-dot" />
                    AUTO-SAVED
                  </span>
                </div>

                {state.editingPostId !== null ? (
                  <>
                    <button className="pub-btn-main" onClick={updatePost} disabled={state.isPublishing}>
                      {state.isPublishing ? "Saving…" : "• UPDATE POST"}
                    </button>
                    <div className="pub-btn-row" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                      <button className="pub-schedule" onClick={() => { set("editingPostId", null); clearEditor(); }} disabled={state.isPublishing}>
                        ✕ Exit
                      </button>
                      <button 
                        className="pub-schedule" 
                        style={{ color: "var(--red)", border: "1px solid var(--red-dim)" }} 
                        onClick={() => handleDeletePost(state.allPosts.find(p => p.id === state.editingPostId))} 
                        title="Delete Post"
                      >
                        {I.trash} Delete
                      </button>
                      <button className="pub-save" onClick={saveDraftManually}>
                        {I.save} Save
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button className="pub-btn-main" onClick={publishPost} disabled={state.isPublishing}>
                      {state.isPublishing ? "Publishing…" : "• PUBLISH NOW"}
                    </button>
                    <div className="pub-btn-row">
                      <button className="pub-schedule" onClick={() => set("showScheduleModal", true)} disabled={state.isPublishing}>
                        {I.clock} SCHEDULE
                      </button>
                      <button className="pub-save" onClick={saveDraftManually} disabled={state.isPublishing}>
                        {I.save} SAVE DRAFT
                      </button>
                    </div>
                  </>
                )}
              </div>

            </aside>

          </div>
        </div>
      </div>
    </div>
  );
}

