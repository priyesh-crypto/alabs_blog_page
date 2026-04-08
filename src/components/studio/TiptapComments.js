"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, MoreHorizontal, Check, X, ArrowUp } from "lucide-react";

function timeAgo(isoDate) {
  const diffMs = new Date() - new Date(isoDate);
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function TiptapComments({ editor, outerRef, comments = [], onUpdateComments, currentAuthor }) {
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [positions, setPositions] = useState({});
  const [replyText, setReplyText] = useState("");
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!editor || !outerRef.current) return;
    
    const updatePositions = () => {
      const poses = {};
      const view = editor.view;
      const doc = editor.state.doc;
      const outerRect = outerRef.current.getBoundingClientRect();
      
      let lastTop = -999;
      
      doc.descendants((node, pos) => {
        let id = null;
        if (node.isText) {
          const mark = node.marks.find(m => m.type.name === 'comment');
          if (mark) id = mark.attrs.commentId;
        } else if (node.type.name === 'image' || node.type.name === 'video') {
          if (node.attrs.commentId) id = node.attrs.commentId;
        }

        if (id && !poses[id]) {
          const coords = view.coordsAtPos(pos);
          let top = coords.top - outerRect.top;
          
          if (top < lastTop + 34) {
             top = lastTop + 34;
          }
          
          poses[id] = top;
          lastTop = top;
        }
      });
      setPositions(poses);
    };

    editor.on('transaction', updatePositions);
    window.addEventListener('resize', updatePositions);
    
    // Initial calculation (need a slight delay for DOM paint)
    setTimeout(updatePositions, 50);

    return () => {
      editor.off('transaction', updatePositions);
      window.removeEventListener('resize', updatePositions);
    };
  }, [editor, comments, outerRef]);

  // Click outside to collapse
  useEffect(() => {
    const handleOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) && !e.target.closest('.tc-avatar-btn')) {
        setActiveCommentId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleResolve = (id) => {
    if (editor) {
      // Clear from marks (text)
      editor.commands.unsetComment(id);
      
      // Clear from nodes (images/videos)
      editor.state.doc.descendants((node, pos) => {
        if ((node.type.name === 'image' || node.type.name === 'video') && node.attrs.commentId === id) {
          editor.commands.updateAttributes(node.type.name, { commentId: null });
        }
      });
    }
    const newComments = comments.filter(c => c.id !== id);
    onUpdateComments(newComments);
    setActiveCommentId(null);
  };

  const handleReply = (parentCommentId) => {
    if (!replyText.trim()) return;
    
    const newComments = comments.map(c => {
      if (c.id === parentCommentId) {
        return {
          ...c,
          replies: [
            ...(c.replies || []),
            {
              id: Date.now().toString(),
              author: currentAuthor?.name || "Author",
              avatar: currentAuthor?.image || "/authors/default.png",
              text: replyText.trim(),
              createdAt: new Date().toISOString()
            }
          ]
        };
      }
      return c;
    });
    
    onUpdateComments(newComments);
    setReplyText("");
  };

  // If there are no visually mapped comments, don't render anything
  if (Object.keys(positions).length === 0) return null;

  return (
    <div className="tiptap-comments-layer" style={{ position: 'absolute', right: -60, top: 0, bottom: 0, width: 32, zIndex: 40 }}>
      {comments.map(comment => {
        const top = positions[comment.id];
        if (top === undefined) return null;
        
        const isActive = activeCommentId === comment.id;

        return (
          <div key={comment.id} style={{ position: 'absolute', top, left: 0 }}>
            {/* Avatar Bubble */}
            <button 
              className={`tc-avatar-btn ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveCommentId(isActive ? null : comment.id);
              }}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                padding: 0, border: isActive ? '2px solid #ef4444' : '2px solid var(--border)',
                cursor: 'pointer', overflow: 'hidden', background: 'var(--bg2)',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <img src={comment.authorAvatar || "/authors/default.png"} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=" + comment.authorName} />
            </button>

            {/* Comment Popover */}
            {isActive && (
              <div 
                ref={popoverRef}
                className="tc-popover"
                style={{
                  position: 'absolute', top: 0, right: 40, width: 300,
                  background: 'var(--bg0)', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  zIndex: 99, display: 'flex', flexDirection: 'column'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.1px' }}>Comment</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }} title="Options"><MoreHorizontal size={15} /></button>
                    <button onClick={() => handleResolve(comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)' }} title="Resolve"><Check size={16} /></button>
                    <button onClick={() => setActiveCommentId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)' }} title="Close"><X size={16} /></button>
                  </div>
                </div>

                {/* Main Comment */}
                <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, background: 'var(--bg)' }}>
                  <img src={comment.authorAvatar || "/authors/default.png"} alt="" style={{ width: 30, height: 30, borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=" + comment.authorName} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{comment.authorName}</span>
                      <span style={{ fontSize: 11, color: 'var(--text4)' }}>{timeAgo(comment.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{comment.text}</div>
                  </div>
                </div>
                
                {/* Replies */}
                {comment.replies && comment.replies.map(reply => (
                  <div key={reply.id} style={{ padding: '12px 14px 12px 32px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, background: 'var(--bg2)' }}>
                    <img src={reply.avatar || "/authors/default.png"} alt="" style={{ width: 24, height: 24, borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=" + reply.author} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{reply.author}</span>
                        <span style={{ fontSize: 11, color: 'var(--text4)' }}>{timeAgo(reply.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{reply.text}</div>
                    </div>
                  </div>
                ))}

                {/* Reply Input */}
                <div style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bg2)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                  <img src={currentAuthor?.image || "/authors/default.png"} alt="" style={{ width: 24, height: 24, borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)' }} onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=" + (currentAuthor?.name || "Author")} />
                  <input 
                    type="text" 
                    value={replyText} 
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleReply(comment.id) }}
                    placeholder="Write a reply..." 
                    style={{ 
                      flex: 1, 
                      background: 'var(--bg)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 8, 
                      padding: '8px 12px', 
                      fontSize: 13, 
                      outline: 'none', 
                      color: 'var(--text)',
                      transition: 'border-color 0.2s'
                    }} 
                  />
                  <button 
                    onClick={() => handleReply(comment.id)}
                    style={{ 
                      width: 28, height: 28, borderRadius: '50%', background: replyText.trim() ? 'var(--sb-bg-from)' : 'var(--bg4)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: replyText.trim() ? 'pointer' : 'default',
                      color: replyText.trim() ? '#fff' : 'var(--text4)', transition: 'all 0.2s'
                    }}
                  >
                    <ArrowUp size={14} strokeWidth={2.5} />
                  </button>
                </div>

              </div>
            )}
          </div>
        );
      })}
      
      <style dangerouslySetInnerHTML={{__html: `
        .inline-comment-mark {
          background-color: var(--orange-dim);
          border-bottom: 2px solid var(--orange);
          transition: background-color 0.2s;
          cursor: pointer;
        }
        .inline-comment-mark:hover {
          background-color: rgba(249, 115, 22, 0.2);
        }
        .commented-media {
          outline: 3px solid var(--orange-dim) !important;
          outline-offset: 4px;
          background-color: rgba(249, 115, 22, 0.05) !important;
        }
        .tc-avatar-btn.active {
          box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--orange) !important;
          border: none !important;
        }
        .tc-popover {
          transform: translateY(-50%);
          margin-top: 16px;
          animation: tcFadeIn 0.2s ease-out;
        }
        @keyframes tcFadeIn {
          from { opacity: 0; transform: translateY(-40%) scale(0.95); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
      `}} />
    </div>
  );
}
