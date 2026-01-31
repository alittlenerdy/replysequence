'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write your email...',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    immediatelyRender: false, // Important for SSR compatibility
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const MenuButton = useCallback(
    ({
      onClick,
      isActive = false,
      disabled = false,
      children,
      title,
    }: {
      onClick: () => void;
      isActive?: boolean;
      disabled?: boolean;
      children: React.ReactNode;
      title: string;
    }) => (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`
          p-1.5 rounded transition-colors
          ${isActive
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {children}
      </button>
    ),
    []
  );

  if (!editor) {
    return (
      <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-4 min-h-[300px] animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-700 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800/50">
      {/* Toolbar */}
      {editable ? (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-600 bg-gray-900/50">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4m-2 0l-4 16m0 0h4" />
            </svg>
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M9 4l-2 16m8-16l-2 16" />
            </svg>
          </MenuButton>

          <div className="w-px h-5 bg-gray-600 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              <circle cx="2" cy="6" r="1" fill="currentColor" />
              <circle cx="2" cy="12" r="1" fill="currentColor" />
              <circle cx="2" cy="18" r="1" fill="currentColor" />
            </svg>
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13" />
              <text x="2" y="8" className="text-[8px]" fill="currentColor">1</text>
              <text x="2" y="14" className="text-[8px]" fill="currentColor">2</text>
              <text x="2" y="20" className="text-[8px]" fill="currentColor">3</text>
            </svg>
          </MenuButton>

          <div className="w-px h-5 bg-gray-600 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Inline Code"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </MenuButton>

          <div className="w-px h-5 bg-gray-600 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </MenuButton>
        </div>
      ) : null}

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className={`
          prose prose-invert max-w-none
          p-4 min-h-[250px] max-h-[400px] overflow-y-auto
          focus:outline-none
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:min-h-[200px]
          [&_.ProseMirror_p]:my-2
          [&_.ProseMirror_ul]:list-disc
          [&_.ProseMirror_ul]:pl-5
          [&_.ProseMirror_ol]:list-decimal
          [&_.ProseMirror_ol]:pl-5
          [&_.ProseMirror_blockquote]:border-l-4
          [&_.ProseMirror_blockquote]:border-gray-500
          [&_.ProseMirror_blockquote]:pl-4
          [&_.ProseMirror_blockquote]:italic
          [&_.ProseMirror_code]:bg-gray-700
          [&_.ProseMirror_code]:px-1
          [&_.ProseMirror_code]:rounded
          [&_.ProseMirror_code]:font-mono
          [&_.ProseMirror_code]:text-sm
          [&_.is-editor-empty:first-child::before]:text-gray-500
          [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.is-editor-empty:first-child::before]:float-left
          [&_.is-editor-empty:first-child::before]:h-0
          [&_.is-editor-empty:first-child::before]:pointer-events-none
        `}
      />

      {/* Character count */}
      {editable ? (
        <div className="px-4 py-2 border-t border-gray-600 bg-gray-900/50 text-xs text-gray-500 text-right">
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length} characters
        </div>
      ) : null}
    </div>
  );
}

/**
 * Convert HTML to plain text for email sending
 */
export function htmlToPlainText(html: string): string {
  // Create a temporary element to parse HTML
  if (typeof document === 'undefined') {
    // Server-side: basic regex-based conversion
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}
