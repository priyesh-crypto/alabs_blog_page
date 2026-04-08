"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/Toast";
import { postCommentAction, fetchCommentsAction, likeCommentAction } from "@/app/actions";

// Deterministic avatar color from username
const AVATAR_COLORS = [
  { bg: "#003b93", text: "#fff" },
  { bg: "#0e7490", text: "#fff" },
  { bg: "#7c3aed", text: "#fff" },
  { bg: "#b45309", text: "#fff" },
  { bg: "#059669", text: "#fff" },
  { bg: "#dc2626", text: "#fff" },
  { bg: "#0369a1", text: "#fff" },
  { bg: "#9333ea", text: "#fff" },
];
function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0] || "").join("").toUpperCase().slice(0, 2) || "?";
}

/**
 * Discussion / comments section backed by Supabase.
 *
 * @param {{ postSlug?: string, title?: string }} props
 *   - postSlug: required to persist to DB. If omitted, falls back to local-only mode.
 */
export default function DiscussionSection({ postSlug, title = "Discussion" }) {
  const addToast = useToast();
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [userName, setUserName] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [likedSet, setLikedSet] = useState(new Set());

  // Load comments from Supabase
  const loadComments = useCallback(async () => {
    if (!postSlug) return;
    const result = await fetchCommentsAction(postSlug);
    if (result.success) {
      setComments(result.comments);
    }
  }, [postSlug]);

  useEffect(() => {
    loadComments();
    // Restore liked set from localStorage
    try {
      const stored = localStorage.getItem(`likedComments_${postSlug}`);
      if (stored) setLikedSet(new Set(JSON.parse(stored)));
    } catch {}
  }, [loadComments, postSlug]);

  async function postComment() {
    if (!commentInput.trim()) return;
    setLoading(true);
    try {
      const result = await postCommentAction({
        postSlug: postSlug || "general",
        userName: userName.trim() || "Anonymous",
        text: commentInput,
      });
      if (result.success) {
        setComments((c) => [result.comment, ...c]);
        setCommentInput("");
        addToast("Comment posted!", "success");
      } else {
        addToast(result.error || "Failed to post", "error");
      }
    } catch {
      addToast("Failed to post comment", "error");
    } finally {
      setLoading(false);
    }
  }

  async function postReply(parentId) {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      const result = await postCommentAction({
        postSlug: postSlug || "general",
        userName: userName.trim() || "Anonymous",
        text: replyText,
        parentCommentId: parentId,
      });
      if (result.success) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...c.replies, result.comment] }
              : c
          )
        );
        setReplyText("");
        setReplyingTo(null);
        addToast("Reply posted!", "success");
      } else {
        addToast(result.error || "Failed to reply", "error");
      }
    } catch {
      addToast("Failed to post reply", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(commentId) {
    const key = String(commentId);
    const already = likedSet.has(key);
    const delta = already ? -1 : 1;

    // Optimistic update
    const nextLiked = new Set(likedSet);
    if (already) nextLiked.delete(key);
    else nextLiked.add(key);
    setLikedSet(nextLiked);
    localStorage.setItem(`likedComments_${postSlug}`, JSON.stringify([...nextLiked]));

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) return { ...c, likes: Math.max(0, c.likes + delta) };
        return {
          ...c,
          replies: c.replies.map((r) =>
            r.id === commentId ? { ...r, likes: Math.max(0, r.likes + delta) } : r
          ),
        };
      })
    );

    // Persist to DB
    await likeCommentAction(commentId, delta);
  }

  const totalComments = comments.length + comments.reduce((a, c) => a + (c.replies?.length || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg text-on-background dark:text-[#dae2fd]">
          {title}
        </h3>
        <span className="text-sm text-on-surface-variant dark:text-[#8c909f]">
          {totalComments} comment{totalComments !== 1 ? "s" : ""}
        </span>
      </div>

      {/* New comment */}
      <div className="flex gap-3 mb-8 items-start flex-col sm:flex-row">
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-full bg-surface-container-high dark:bg-[#2d3449] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-lg">person</span>
          </div>
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            className="w-36 px-3 py-2.5 rounded-xl text-sm outline-none bg-surface-container-low dark:bg-[#131b2e] dark:text-[#dae2fd] border border-outline-variant/20 dark:border-[#424754] focus:ring-2 focus:ring-primary/20 placeholder:text-outline/60"
          />
        </div>
        <div className="flex gap-3 flex-1 w-full">
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && postComment()}
            placeholder="Ask a question or share your thoughts..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none bg-surface-container-low dark:bg-[#131b2e] dark:text-[#dae2fd] border border-outline-variant/20 dark:border-[#424754] focus:ring-2 focus:ring-primary/20 placeholder:text-outline/60 disabled:opacity-60"
          />
          <button
            onClick={postComment}
            disabled={loading}
            className="glass-chip active px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap self-center disabled:opacity-60"
          >
            {loading ? "…" : "Post"}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex flex-col divide-y divide-outline-variant/10 dark:divide-[#424754]/40">
        {comments.map((c) => {
          const color = getAvatarColor(c.user);
          return (
            <div key={c.id} className="flex gap-4 py-5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ background: color.bg, color: color.text }}
              >
                {getInitials(c.user)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-on-background dark:text-[#dae2fd]">{c.user}</span>
                  <span className="text-xs text-on-surface-variant dark:text-[#8c909f]">{c.time}</span>
                </div>
                <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed">{c.text}</p>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handleLike(c.id)}
                    className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                      likedSet.has(String(c.id))
                        ? "text-primary dark:text-[#adc6ff]"
                        : "text-on-surface-variant dark:text-[#8c909f] hover:text-primary dark:hover:text-[#adc6ff]"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: likedSet.has(String(c.id)) ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      favorite
                    </span>
                    {c.likes > 0 && c.likes}
                  </button>
                  <button
                    onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                    className="text-xs font-medium text-on-surface-variant dark:text-[#8c909f] hover:text-primary dark:hover:text-[#adc6ff] transition-colors"
                  >
                    Reply
                  </button>
                </div>

                {/* Reply form */}
                {replyingTo === c.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !loading && postReply(c.id)}
                      placeholder="Write a reply..."
                      disabled={loading}
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none bg-surface-container-lowest dark:bg-[#060e20] dark:text-[#dae2fd] border border-outline-variant/20 dark:border-[#424754] focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    />
                    <button
                      onClick={() => postReply(c.id)}
                      disabled={loading}
                      className="px-4 py-2 bg-primary text-on-primary rounded-full font-bold text-xs whitespace-nowrap disabled:opacity-60"
                    >
                      Reply
                    </button>
                  </div>
                )}

                {/* Replies */}
                {c.replies?.map((r) => {
                  const rColor = getAvatarColor(r.user);
                  return (
                    <div key={r.id} className="mt-4 flex gap-3 pl-4 border-l-2 border-outline-variant/10 dark:border-[#424754]">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                        style={{ background: rColor.bg, color: rColor.text }}
                      >
                        {getInitials(r.user)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm text-on-background dark:text-[#dae2fd]">{r.user}</span>
                          <span className="text-xs text-on-surface-variant dark:text-[#8c909f]">{r.time}</span>
                        </div>
                        <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed">{r.text}</p>
                        <button
                          onClick={() => handleLike(r.id)}
                          className={`mt-1 text-xs font-medium flex items-center gap-1 transition-colors ${
                            likedSet.has(String(r.id))
                              ? "text-primary dark:text-[#adc6ff]"
                              : "text-on-surface-variant dark:text-[#8c909f] hover:text-primary dark:hover:text-[#adc6ff]"
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: likedSet.has(String(r.id)) ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            favorite
                          </span>
                          {r.likes > 0 && r.likes}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {comments.length === 0 && (
          <p className="text-sm text-on-surface-variant dark:text-[#8c909f] py-8 text-center">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
}
