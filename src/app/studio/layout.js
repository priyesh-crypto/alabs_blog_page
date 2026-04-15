"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import useStudioDraft from "@/hooks/useStudioDraft";
import StudioSidebar from "@/components/studio/StudioSidebar";
import { StudioContext } from "@/components/studio/StudioSidebarContext";
import "./studio.css";

export default function StudioLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, authorProfile, signOut } = useAuth();

  const {
    state,
    set,
    setMany,
    dispatch,
    showToast,
    fetchAllPosts,
    clearEditor,
    loadPostForEdit,
    restoreDraft,
    discardDraft,
    clearDraftOnSuccess,
  } = useStudioDraft();

  const authorSlug = authorProfile?.slug || "al-editorial";
  const dynamicAuthor = {
    slug: authorSlug,
    name: authorProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Author",
    image: authorProfile?.image || user?.user_metadata?.avatar_url || "/authors/default.svg",
    initials: authorProfile?.initials || user?.user_metadata?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || "U",
    is_super_admin: authorProfile?.is_super_admin || false,
    email: user?.email,
  };

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

  const handleClearEditor = () => {
    clearEditor();
    if (pathname !== '/studio') router.push('/studio');
  };

  const handleLoadPostForEdit = (post) => {
    loadPostForEdit(post);
    if (pathname !== '/studio') router.push('/studio');
  };

  const contextValue = {
    state,
    set,
    setMany,
    dispatch,
    showToast,
    fetchAllPosts,
    clearEditor,
    loadPostForEdit,
    restoreDraft,
    discardDraft,
    clearDraftOnSuccess,
    dynamicAuthor,
    signOut,
    user,
    authorProfile,
  };

  return (
    <StudioContext.Provider value={contextValue}>
      <div className="studio-wrapper">
        <div className="app">
          <StudioSidebar
            viewMode={state.viewMode}
            postsViewMode={state.postsViewMode}
            allPosts={state.allPosts}
            clearEditor={handleClearEditor}
            loadPostForEdit={handleLoadPostForEdit}
            fetchAllPosts={fetchAllPosts}
            set={set}
            setMany={setMany}
            onGoHome={() => router.push("/")}
            signOut={signOut}
            dynamicAuthor={dynamicAuthor}
          />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
      </div>
    </StudioContext.Provider>
  );
}
