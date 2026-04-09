"use client";

import { I } from "./StudioIcons";

export default function StudioSidebar({
  viewMode,
  postsViewMode,
  allPosts,
  clearEditor,
  loadPostForEdit,
  fetchAllPosts,
  set,
  setMany,
  onGoHome,
  signOut,
  dynamicAuthor,
}) {
  return (
    <nav className="sidebar">
      {/* Brand Logo */}
      <div className="sb-logo" onClick={onGoHome} title="Go to home">
        <img src="/white.svg" alt="AnalytixLabs Studio" />
      </div>

      {/* New Post Button */}
      <button className="sb-new-post" onClick={clearEditor}>
        {I.plus}
        NEW POST
      </button>

      {/* Workspace */}
      <div className="sb-label">WORKSPACE</div>
      <div
        className={`sb-nav ${viewMode === "write" && postsViewMode === "editor" ? "active" : ""}`}
        onClick={() => setMany({ viewMode: "write", postsViewMode: "editor" })}
      >
        {I.edit} Edit
      </div>
      <div
        className={`sb-nav ${viewMode === "preview" && postsViewMode === "editor" ? "active" : ""}`}
        onClick={() => setMany({ viewMode: "preview", postsViewMode: "editor" })}
      >
        {I.eye} Preview
      </div>
      <div
        className={`sb-nav ${postsViewMode === "posts" ? "active" : ""}`}
        onClick={() => {
          set("postsViewMode", postsViewMode === "posts" ? "editor" : "posts");
          fetchAllPosts();
        }}
      >
        {I.list} All Posts
      </div>
      <div
        className={`sb-nav ${postsViewMode === "settings" ? "active" : ""}`}
        onClick={() => {
          window.location.href = '/studio/settings';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Settings
      </div>

      {/* Super Admin Nav */}
      {dynamicAuthor?.is_super_admin ? (
         <>
           <div className="sb-label" style={{ marginTop: 20 }}>ADMINISTRATION</div>
           <div className={`sb-nav ${postsViewMode === 'admin' ? 'active' : ''}`} onClick={() => window.location.href = '/studio/admin'}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> 
             Manage Team
           </div>
         </>
      ) : (
        // Recovery link for the designated super admin
        dynamicAuthor?.email === 'priyesh@scaletrix.ai' && (
          <div 
            className="sb-nav" 
            style={{ color: 'var(--orange)', border: '1px dashed var(--orange)', marginTop: 20, borderRadius: 8 }}
            onClick={() => window.location.href = '/api/admin-setup'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Verify Admin Access
          </div>
        )
      )}

      {/* Recent Drafts */}
      <div className="sb-label">RECENT DRAFTS</div>
      <div className="sb-drafts">
        {allPosts.slice(0, 8).map((p) => {
          const dotColor = p.status === "Published" ? "var(--green)" : p.status === "Scheduled" ? "var(--orange)" : "#64748b";
          return (
            <div key={p.id} className="sb-draft" onClick={() => loadPostForEdit(p)}>
              <div className="sb-draft-row">
                <div className="sb-dot" style={{ background: dotColor }} />
                <span className="sb-draft-meta">{p.status || "Draft"} • {p.publishedAt || "just now"}</span>
              </div>
              <div className="sb-draft-title">{p.title || "Untitled..."}</div>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />
      
      {/* User Profile Footer */}
      <div className="sb-user" onClick={() => window.location.href = '/studio/settings'}>
        <div className="sb-avatar">
          {dynamicAuthor?.image ? (
            <img src={dynamicAuthor.image} alt="" className="sb-avatar" style={{ border: 'none' }} />
          ) : (
            dynamicAuthor?.initials || (dynamicAuthor?.name ? dynamicAuthor.name.charAt(0).toUpperCase() : "U")
          )}
        </div>
        <div className="sb-user-info">
          <span className="sb-user-name">{dynamicAuthor?.name || "User"}</span>
          <span className="sb-user-role">{dynamicAuthor?.is_super_admin ? "Super Admin" : "Author"}</span>
        </div>
        <div className="sb-footer-acts" onClick={e => e.stopPropagation()}>
          {signOut && (
            <button className="sb-foot-btn" onClick={signOut} title="Sign Out">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
