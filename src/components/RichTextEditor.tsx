'use client';

import { useRef, useState, type ElementType } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading2, Heading3, Quote, Minus, Plus, type LucideIcon } from 'lucide-react';

interface Tool {
  icon: LucideIcon;
  label: string;
  action: () => void;
  syntax: string;
}

interface RichTextEditorProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  rows?: number;
}

export function RichTextEditor({
  name,
  value,
  onChange,
  placeholder,
  label,
  rows = 5
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const tools: Tool[] = [
    { icon: Bold, label: 'Bold', action: () => insertAtCursor('**', '**'), syntax: '**text**' },
    { icon: Italic, label: 'Italic', action: () => insertAtCursor('_', '_'), syntax: '_text_' },
    { icon: Underline, label: 'Underline', action: () => insertAtCursor('<u>', '</u>'), syntax: '<u>text</u>' },
    { icon: List, label: 'Bullet List', action: () => insertAtCursor('- '), syntax: '- Item' },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertAtCursor('1. '), syntax: '1. Item' },
    { icon: Heading2, label: 'Heading', action: () => insertAtCursor('## ', ''), syntax: '## Heading' },
    { icon: Heading3, label: 'Subheading', action: () => insertAtCursor('### ', ''), syntax: '### Subheading' },
    { icon: Quote, label: 'Quote', action: () => insertAtCursor('> '), syntax: '> Quote' },
    { icon: Minus, label: 'Divider', action: () => insertAtCursor('\n---\n'), syntax: '---' },
    { icon: Plus, label: 'New Line', action: () => insertAtCursor('\n'), syntax: '\\n' },
  ];

  const getPreview = (text: string) => {
    return text
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-3 mb-1">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/<u>(.+?)<\/u>/g, '<u>$1</u>')
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/^1\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-black/30 pl-3 italic">$1</blockquote>')
      .replace(/---/g, '<hr class="my-4 border-t border-black/20" />')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-black/70">
          {label}
        </label>
      </div>
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-black/5 rounded-t-2xl border-b border-black/10">
        {tools.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={tool.action}
              title={`${tool.label}: ${tool.syntax}`}
              className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            >
              <Icon className="w-4 h-4 text-black/60" />
            </button>
          );
        })}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white border-none rounded-b-2xl rounded-t-none px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all resize-y min-h-[120px]"
      />

      {/* Live Preview Toggle */}
      {value && (
        <details className="text-xs">
          <summary className="cursor-pointer text-black/50 hover:text-black/70">Preview</summary>
          <div 
            className="mt-2 p-4 bg-white rounded-xl border border-black/10 text-sm"
            dangerouslySetInnerHTML={{ __html: getPreview(value) }}
          />
        </details>
      )}
    </div>
  );
}