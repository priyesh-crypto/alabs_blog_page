"use client";

import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapImage from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import './TiptapEditor.css';
import { ImageIcon, Video, Code, Plus } from 'lucide-react';

const lowlight = createLowlight(common);

const CustomDocument = Document.extend({
  content: 'heading block*',
});

// ── Bubble Menu (renders on text selection) ──────────────────
function SelectionMenu({ editor, outerRef }) {
  const [pos, setPos] = useState(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty) { setPos(null); setShowLinkInput(false); return; }
      if (!outerRef?.current) return;

      const view = editor.view;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const outerRect = outerRef.current.getBoundingClientRect();

      setPos({
        left: (start.left + end.left) / 2 - outerRect.left,
        top: start.top - outerRect.top - 52,
      });
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
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} title="Blockquote">❝</button>
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
      {showLinkInput && !isLinkActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
          <input
            autoFocus
            type="text"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder="https://…"
            style={{ background: '#2a2a2a', color: '#fff', border: '1px solid #555', borderRadius: 4, padding: '3px 7px', fontSize: 12, width: 160, outline: 'none' }}
          />
          <button onClick={applyLink} title="Apply" style={{ fontSize: 13 }}>✓</button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} title="Cancel" style={{ fontSize: 13 }}>✕</button>
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
        setPos({ top: coords.top - outerRect.top });
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
        editor.commands.insertContent(
          `<p><video src="${data.url}" controls style="max-width:100%;border-radius:8px;margin:16px 0;display:block;"></video></p>`
        );
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
      style={{ position: 'absolute', left: -44, top: pos.top - 17, zIndex: 50 }}
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
const TiptapEditor = ({ content, onChange }) => {
  const outerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      CustomDocument,
      StarterKit.configure({ document: false, codeBlock: false }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Article title…';
          return 'Tell your story…';
        },
      }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: content || '<h1></h1><p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange && onChange(editor.getHTML()),
  });

  return (
    <div ref={outerRef} className="tiptap-outer" style={{ position: 'relative' }}>
      <SelectionMenu editor={editor} outerRef={outerRef} />
      <PlusMenu editor={editor} outerRef={outerRef} />
      <div className="tiptap-prose">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
