"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapImage from '@tiptap/extension-image';
import { TextStyle, FontFamily } from '@tiptap/extension-text-style';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import './TiptapEditor.css';
import { ImageIcon, Video, Code, Plus, MessageSquare } from 'lucide-react';
import { CommentMark } from './studio/CommentMark';
import TiptapComments from './studio/TiptapComments';

// ── Custom Video Node ────────────────────────────────────────
const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      commentId: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'video[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const { commentId, ...rest } = HTMLAttributes;
    return ['video', mergeAttributes(rest, {
      controls: true,
      'data-comment-id': commentId,
      class: commentId ? 'commented-media' : '',
      style: 'max-width:100%;border-radius:12px;margin:28px 0;display:block;box-shadow: 0 4px 24px rgba(0,0,0,0.08);' + (commentId ? 'outline: 3px solid var(--blue-dim); outline-offset: 4px;' : ''),
    })];
  },
});

const CustomImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) return {};
          return {
            'data-comment-id': attributes.commentId,
            class: 'commented-media',
          };
        },
      },
    };
  },
});

const lowlight = createLowlight(common);


// ── Bubble Menu (renders on text selection) ──────────────────
function SelectionMenu({ editor, outerRef, comments, onUpdateComments, currentAuthor }) {
  const [pos, setPos] = useState(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showAltInput, setShowAltInput] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { selection } = editor.state;
      const { from, to, empty } = selection;
      
      const isNodeSelection = selection.node;
      const nodeType = isNodeSelection?.type.name;
      const isMediaSelected = nodeType === 'image' || nodeType === 'video';

      if (empty && !isMediaSelected) { setPos(null); setShowLinkInput(false); setShowAltInput(false); setShowCommentInput(false); return; }
      if (!outerRef?.current) return;

      const view = editor.view;
      const outerRect = outerRef.current.getBoundingClientRect();

      if (isMediaSelected) {
        const node = view.nodeDOM(from);
        if (node) {
          const rect = node.getBoundingClientRect();
          setPos({
            left: (rect.left + rect.right) / 2 - outerRect.left,
            top: rect.top - outerRect.top - 58,
          });
          setAltText(isNodeSelection.attrs.alt || "");
        }
      } else {
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        setPos({
          left: (start.left + end.left) / 2 - outerRect.left,
          top: start.top - outerRect.top - 52,
        });
      }
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor, outerRef]);

  if (!pos || !editor) return null;

  const isLinkActive = editor.isActive('link');

  const applyLink = () => {
    if (linkUrl.trim()) editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
  };

  const handleAddComment = () => {
    if (!commentDraft.trim() || !onUpdateComments) return;
    const commentId = Date.now().toString();
    const { selection } = editor.state;

    if (selection.node && (selection.node.type.name === 'image' || selection.node.type.name === 'video')) {
      editor.chain().focus().updateAttributes(selection.node.type.name, { commentId }).run();
    } else {
      editor.chain().focus().setComment(commentId).run();
    }
    
    // Add to state
    onUpdateComments([
      ...(comments || []),
      {
        id: commentId,
        authorName: currentAuthor?.name || "Author",
        authorAvatar: currentAuthor?.image || "/authors/default.svg",
        text: commentDraft.trim(),
        createdAt: new Date().toISOString(),
        replies: []
      }
    ]);

    setCommentDraft('');
    setShowCommentInput(false);
  };

  const applyAlt = () => {
    const { selection } = editor.state;
    if (selection.node) {
      editor.chain().focus().updateAttributes(selection.node.type.name, { alt: altText.trim() }).run();
    }
    setShowAltInput(false);
  };

  const handleAltKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); applyAlt(); }
    if (e.key === 'Escape') { setShowAltInput(false); }
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); }
    if (e.key === 'Escape') { setShowCommentInput(false); setCommentDraft(''); }
  };

  const handleLinkKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
    if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); }
  };

  return (
    <div
      ref={menuRef}
      className="bubble-menu"
      style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translateX(-50%)', zIndex: 50 }}
      onMouseDown={(e) => e.preventDefault()} // prevent editor blur on click
    >
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold"><b>B</b></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic"><i>I</i></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Strikethrough"><s>S</s></button>
      <div className="bmenu-sep" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Heading 2">H2</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} title="Heading 3">H3</button>
      <div className="bmenu-sep" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Bullet list">•</button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Numbered list">1.</button>
      <div className="bmenu-sep" />
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} title="Key Insight callout" style={{ fontSize: 11, letterSpacing: '0.02em' }}>💡 Key Insight</button>
      <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'is-active' : ''} title="Inline code">{'<>'}</button>
      <div className="bmenu-sep" />
      {isLinkActive ? (
        <button onClick={removeLink} className="is-active" title="Remove link">🔗✕</button>
      ) : (
        <button
          onClick={() => { setShowLinkInput(l => !l); setLinkUrl(editor.getAttributes('link').href || ''); }}
          title="Add link"
        >🔗</button>
      )}
      <div className="bmenu-sep" />
      <button 
        onClick={() => {
          if (showCommentInput) handleAddComment();
          else setShowCommentInput(true);
        }} 
        className={showCommentInput ? 'is-active' : ''} 
        title="Add Comment"
      >
        <MessageSquare size={14} style={{ marginBottom: -2 }} />
      </button>

      {/* Media specific toggle */}
      {(editor.isActive('image') || editor.state.selection.node?.type.name === 'video') && (
        <>
          <div className="bmenu-sep" />
          <button 
            onClick={() => setShowAltInput(s => !s)} 
            className={showAltInput ? 'is-active' : ''}
            title="Edit Alt Text"
            style={{ fontSize: 11, fontWeight: 700 }}
          >
            ALT
          </button>
        </>
      )}

      {showLinkInput && !isLinkActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
          <input
            autoFocus
            type="text"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder="https://…"
            style={{ 
              background: 'var(--bg2)', 
              color: 'var(--text)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              padding: '4px 8px', 
              fontSize: 12, 
              width: 170, 
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
          <button onClick={applyLink} title="Apply" style={{ fontSize: 13, color: 'var(--green)' }}>✓</button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} title="Cancel" style={{ fontSize: 13, color: 'var(--text4)' }}>✕</button>
        </div>
      )}

      {showCommentInput && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
          <input
            autoFocus
            type="text"
            value={commentDraft}
            onChange={e => setCommentDraft(e.target.value)}
            onKeyDown={handleCommentKeyDown}
            placeholder="Type your comment..."
            style={{ 
              background: 'var(--bg2)', 
              color: 'var(--text)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              padding: '4px 8px', 
              fontSize: 12, 
              width: 180, 
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
          <button onClick={handleAddComment} title="Post" style={{ fontSize: 13, color: 'var(--green)' }}>✓</button>
          <button onClick={() => { setShowCommentInput(false); setCommentDraft(''); }} title="Cancel" style={{ fontSize: 13, color: 'var(--text4)' }}>✕</button>
        </div>
      )}

      {showAltInput && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
          <input
            autoFocus
            type="text"
            value={altText}
            onChange={e => setAltText(e.target.value)}
            onKeyDown={handleAltKeyDown}
            placeholder="Add alt text..."
            style={{ 
              background: 'var(--bg2)', 
              color: 'var(--text)', 
              border: '1px solid var(--border)', 
              borderRadius: 6, 
              padding: '4px 8px', 
              fontSize: 12, 
              width: 170, 
              outline: 'none'
            }}
          />
          <button onClick={applyAlt} title="Apply" style={{ fontSize: 13, color: 'var(--green)' }}>✓</button>
          <button onClick={() => setShowAltInput(false)} title="Cancel" style={{ fontSize: 13, color: 'var(--text4)' }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Plus Menu (renders on empty line focus) ──────────────────
function PlusMenu({ editor, outerRef }) {
  const [pos, setPos] = useState(null);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false); // stable ref to avoid stale closure in editor events
  const imageFileRef = useRef(null);
  const videoFileRef = useRef(null);
  const menuRef = useRef(null);

  // Keep openRef in sync
  useEffect(() => { openRef.current = open; }, [open]);

  // Close when clicking outside the menu
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      // Don't update position while dropdown is open — prevents menu unmounting before click registers
      if (openRef.current) return;

      const { $from, empty } = editor.state.selection;
      if (!empty) { setPos(null); return; }

      const node = $from.parent;
      const isEmpty = node.textContent === '';
      const isNotTitle = node.type.name !== 'heading' || $from.depth > 1;

      if (isEmpty && isNotTitle) {
        if (!outerRef?.current) return;
        const view = editor.view;
        const coords = view.coordsAtPos($from.pos);
        const outerRect = outerRef.current.getBoundingClientRect();
        
        // Ensure the menu doesn't go off-screen if left padding is restricted
        const isNarrow = window.innerWidth < 900;
        setPos({ 
          top: coords.top - outerRect.top,
          left: isNarrow ? 8 : -44 
        });
      } else {
        setPos(null);
      }
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor, outerRef]);

  // ── Image upload ────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
      else alert('Upload failed: ' + (data.error || 'unknown'));
    } catch { alert('Image upload failed. Please try again.'); }
    e.target.value = '';
    setOpen(false);
  };

  // ── Video upload ─────────────────────────────────────────────
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        editor.chain().focus().insertContent({ type: 'video', attrs: { src: data.url } }).run();
      } else alert('Upload failed: ' + (data.error || 'unknown'));
    } catch { alert('Video upload failed. Please try again.'); }
    e.target.value = '';
    setOpen(false);
  };

  if (!pos || !editor) return null;

  return (
    <div
      ref={menuRef}
      className="floating-menu"
      style={{ position: 'absolute', left: pos.left, top: pos.top - 17, zIndex: 100 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Hidden file inputs */}
      <input ref={imageFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
      <input ref={videoFileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} />

      {/* + toggle button */}
      <button
        className={`floating-menu-btn-primary ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Insert block"
      >
        <Plus size={18} strokeWidth={2} />
      </button>

      {/* Dropdown panel — appears below the + button */}
      {open && (
        <div className="floating-options-dropdown">
          <button onClick={() => imageFileRef.current?.click()} className="fod-btn">
            <ImageIcon size={15} strokeWidth={1.5} />
            <span>Image</span>
          </button>
          <button onClick={() => videoFileRef.current?.click()} className="fod-btn">
            <Video size={15} strokeWidth={1.5} />
            <span>Video</span>
          </button>
          <button
            onClick={() => { editor.chain().focus().toggleCodeBlock().run(); setOpen(false); }}
            className="fod-btn"
          >
            <Code size={15} strokeWidth={1.5} />
            <span>Code block</span>
          </button>
          <button
            onClick={() => { editor.chain().focus().toggleBlockquote().run(); setOpen(false); }}
            className="fod-btn"
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>💡</span>
            <span>Key Insight</span>
          </button>
          <div className="fod-sep" />
          <button
            onClick={() => { editor.chain().focus().setHorizontalRule().run(); setOpen(false); }}
            className="fod-btn"
          >
            <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>—</span>
            <span>Divider</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Editor ──────────────────────────────────────────────
import { forwardRef, useImperativeHandle } from 'react';

const TiptapEditor = forwardRef(function TiptapEditor({ content, onChange, onStateChange, editorComments, onUpdateComments, currentAuthor }, ref) {
  const outerRef = useRef(null);
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  const syncToolbarState = useCallback((editor) => {
    if (!onStateChangeRef.current) return;
    onStateChangeRef.current({
      bold:       editor.isActive('bold'),
      italic:     editor.isActive('italic'),
      underline:  editor.isActive('underline'),
      strike:     editor.isActive('strike'),
      h2:         editor.isActive('heading', { level: 2 }),
      h3:         editor.isActive('heading', { level: 3 }),
      bullet:     editor.isActive('bulletList'),
      ordered:    editor.isActive('orderedList'),
      fontFamily: editor.getAttributes('textStyle').fontFamily || '',
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Placeholder.configure({ placeholder: 'Tell your story…' }),
      CustomImage.configure({ inline: false, allowBase64: true }),
      VideoNode,
      CodeBlockLowlight.configure({ lowlight }),
      CommentMark,
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
    ],
    content: content || '<p></p>',
    immediatelyRender: false,
    onUpdate:          ({ editor }) => { onChange && onChange(editor.getHTML()); syncToolbarState(editor); },
    onSelectionUpdate: ({ editor }) => syncToolbarState(editor),
  });

  // Expose the editor instance so parent can call commands from toolbar
  useImperativeHandle(ref, () => editor, [editor]);

  return (
    <div ref={outerRef} className="tiptap-outer" style={{ position: 'relative' }}>
      <SelectionMenu editor={editor} outerRef={outerRef} comments={editorComments} onUpdateComments={onUpdateComments} currentAuthor={currentAuthor} />
      <PlusMenu editor={editor} outerRef={outerRef} />
      <div className="tiptap-prose">
        <EditorContent editor={editor} />
      </div>
      <TiptapComments 
        editor={editor} 
        outerRef={outerRef} 
        comments={editorComments} 
        onUpdateComments={onUpdateComments} 
        currentAuthor={currentAuthor} 
      />
    </div>
  );
});

export default TiptapEditor;
