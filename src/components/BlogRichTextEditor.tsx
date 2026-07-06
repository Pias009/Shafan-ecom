'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Heading2, Heading3, Quote, Minus,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Undo, Redo,
} from 'lucide-react';

interface BlogRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function BlogRichTextEditor({ value, onChange, placeholder }: BlogRichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[220px] px-5 py-4',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const tools: { icon: typeof Bold; label: string; active?: boolean; action: () => void }[] = [
    { icon: Bold, label: 'Bold', active: editor.isActive('bold'), action: () => editor.chain().focus().toggleBold().run() },
    { icon: Italic, label: 'Italic', active: editor.isActive('italic'), action: () => editor.chain().focus().toggleItalic().run() },
    { icon: UnderlineIcon, label: 'Underline', active: editor.isActive('underline'), action: () => editor.chain().focus().toggleUnderline().run() },
    { icon: Strikethrough, label: 'Strikethrough', active: editor.isActive('strike'), action: () => editor.chain().focus().toggleStrike().run() },
    { icon: Heading2, label: 'Heading', active: editor.isActive('heading', { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: Heading3, label: 'Subheading', active: editor.isActive('heading', { level: 3 }), action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { icon: List, label: 'Bullet List', active: editor.isActive('bulletList'), action: () => editor.chain().focus().toggleBulletList().run() },
    { icon: ListOrdered, label: 'Numbered List', active: editor.isActive('orderedList'), action: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: Quote, label: 'Quote', active: editor.isActive('blockquote'), action: () => editor.chain().focus().toggleBlockquote().run() },
    { icon: Minus, label: 'Divider', action: () => editor.chain().focus().setHorizontalRule().run() },
    { icon: AlignLeft, label: 'Align Left', active: editor.isActive({ textAlign: 'left' }), action: () => editor.chain().focus().setTextAlign('left').run() },
    { icon: AlignCenter, label: 'Align Center', active: editor.isActive({ textAlign: 'center' }), action: () => editor.chain().focus().setTextAlign('center').run() },
    { icon: AlignRight, label: 'Align Right', active: editor.isActive({ textAlign: 'right' }), action: () => editor.chain().focus().setTextAlign('right').run() },
    { icon: LinkIcon, label: 'Link', active: editor.isActive('link'), action: setLink },
    { icon: Undo, label: 'Undo', action: () => editor.chain().focus().undo().run() },
    { icon: Redo, label: 'Redo', action: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div className="rounded-2xl border border-black/10 overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-black/5 border-b border-black/10">
        {tools.map(({ icon: Icon, label, active, action }) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={action}
            className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-black text-white' : 'hover:bg-black/10 text-black/60'}`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
