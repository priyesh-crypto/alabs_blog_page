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
function SelectionMenu({ editor }) {
  const [pos, setPos] = useState(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty) { setPos(null); setShowLinkInput(false); return; }

      const view = editor.view;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const editorRect = view.dom.getBoundingClientRect();

      setPos({
        left: (start.left + end.left) / 2 - editorRect.left,
        top: start.top - editorRect.top - 48,
      });
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  if (!pos || !editor) return null;

  const isLinkActive = editor.isActive('link');

  const applyLink = () => {
    if (linkUrl.trim()) {
      editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
    }
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
    >
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold"><b>B</b></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic"><i>I</i></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Heading 2">H2</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} title="Heading 3">H3</button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} title="Quote">❝</button>
      <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'is-active' : ''} title="Code">{'<>'}</button>
      {/* Link button */}
      {isLinkActive ? (
        <button onClick={removeLink} className="is-active" title="Remove link">🔗</button>
      ) : (
        <button
          onClick={() => { setShowLinkInput(l => !l); setLinkUrl(editor.getAttributes('link').href || ''); }}
          title="Add link"
        >🔗</button>
      )}
      {/* Inline link input */}
      {showLinkInput && !isLinkActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
          <input
            autoFocus
            type="text"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder="https://…"
            style={{
              background: '#2a2a2a', color: '#fff', border: '1px solid #555',
              borderRadius: 4, padding: '3px 7px', fontSize: 12, width: 160, outline: 'none',
            }}
          />
          <button onClick={applyLink} title="Apply" style={{ fontSize: 13 }}>✓</button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} title="Cancel" style={{ fontSize: 13 }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Plus Menu (renders on empty line focus) ──────────────────
function PlusMenu({ editor }) {
  const [pos, setPos] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { $from, empty } = editor.state.selection;
      if (!empty) { setPos(null); setOpen(false); return; }

      const node = $from.parent;
      const isEmpty = node.textContent === '';
      const isNotTitle = node.type.name !== 'heading' || $from.depth > 1;

      if (isEmpty && isNotTitle) {
        const view = editor.view;
        const coords = view.coordsAtPos($from.pos);
        const rect = view.dom.getBoundingClientRect();
        setPos({ top: coords.top - rect.top });
      } else {
        setPos(null);
        setOpen(false);
      }
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  const addImage = () => {
    const url = window.prompt('Image URL:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
    setOpen(false);
  };

  const addVideo = () => {
    const url = window.prompt('YouTube embed URL (e.g. https://www.youtube.com/embed/VIDEO_ID):');
    if (url) {
      editor.commands.insertContent(
        `<div class="yt-embed-wrapper"><iframe src="${url}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`
      );
    }
    setOpen(false);
  };

  if (!pos || !editor) return null;

  return (
    <div className="floating-menu" style={{ position: 'absolute', left: -52, top: pos.top - 2 }}>
      <button
        className={`floating-menu-btn-primary ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Insert block"
      >
        <Plus size={18} strokeWidth={2} />
      </button>
      <div className={`floating-options ${open ? 'open' : ''}`}>
        <button title="Image" onClick={addImage}><ImageIcon size={16} strokeWidth={1.5} /></button>
        <button title="Video" onClick={addVideo}><Video size={16} strokeWidth={1.5} /></button>
        <button title="Code block" onClick={() => { editor.chain().focus().toggleCodeBlock().run(); setOpen(false); }}><Code size={16} strokeWidth={1.5} /></button>
        <button title="Divider" onClick={() => { editor.chain().focus().setHorizontalRule().run(); setOpen(false); }}>—</button>
      </div>
    </div>
  );
}

// ── Main Editor ──────────────────────────────────────────────
const TiptapEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      CustomDocument,
      StarterKit.configure({ document: false, codeBlock: false }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Title';
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
    <div className="tiptap-outer" style={{ position: 'relative' }}>
      <SelectionMenu editor={editor} />
      <PlusMenu editor={editor} />
      <div className="tiptap-prose">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
