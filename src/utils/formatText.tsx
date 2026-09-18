import React from 'react';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

export function formatDescription(text: string | undefined | null): React.ReactNode {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  
  const addListItems = () => {
    if (listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal ml-5 space-y-1.5 my-3 text-slate-700">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm sm:text-base leading-relaxed sm:leading-loose text-slate-700">{formatInline(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc ml-5 space-y-1.5 my-3 text-slate-700">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm sm:text-base leading-relaxed sm:leading-loose text-slate-700">{formatInline(item)}</li>
            ))}
          </ul>
        );
      }
      listItems = [];
      inList = false;
      listType = null;
    }
  };

  const formatInline = (line: string): React.ReactNode => {
    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/__(.+?)__/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/<u>(.+?)<\/u>/g, '<u>$1</u>');
    
    if (formatted !== line) {
      return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
    }
    return line;
  };
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('## ')) {
      addListItems();
      elements.push(
        <h2 key={idx} className="text-base sm:text-lg font-bold mt-5 mb-2 text-slate-900">
          {trimmed.replace('## ', '')}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      addListItems();
      elements.push(
        <h3 key={idx} className="text-sm sm:text-base font-semibold mt-4 mb-1.5 text-slate-900">
          {trimmed.replace('### ', '')}
        </h3>
      );
    } else if (trimmed === '---') {
      addListItems();
      elements.push(<hr key={idx} className="my-4 border-t border-slate-200" />);
    } else if (/^1\.\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        addListItems();
        inList = true;
        listType = 'ol';
      }
      listItems.push(trimmed.replace(/^1\.\s*/, ''));
    } else if (/^[-•·]\s/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        addListItems();
        inList = true;
        listType = 'ul';
      }
      listItems.push(trimmed.replace(/^[-•·]\s*/, ''));
    } else if (trimmed.startsWith('> ')) {
      addListItems();
      elements.push(
        <blockquote key={idx} className="border-l-4 border-[#890754]/40 pl-3.5 py-1.5 my-3 italic text-slate-600 bg-slate-50/60 rounded-r-lg">
          {trimmed.replace('> ', '')}
        </blockquote>
      );
    } else if (trimmed) {
      addListItems();
      elements.push(
        <p key={idx} className="text-sm sm:text-base leading-relaxed sm:leading-loose text-slate-700 my-2.5">
          {formatInline(trimmed)}
        </p>
      );
    }
  });
  
  addListItems();
  return elements.length > 0 ? elements : text;
}

function HighlightedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="leading-[1.8] tracking-tight"
    >
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="bg-blue-500/20 px-1.5 py-0.5 rounded text-black font-semibold"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
            >
              {part.replace(/\*\*/g, '')}
            </motion.span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </motion.span>
  );
}

function AnimatedSection({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export function VisualDescription({ description }: { description: string | undefined | null }) {
  if (!description) return null;

  return (
    <div className="w-full text-slate-700 text-sm sm:text-base leading-relaxed sm:leading-loose max-w-none">
      {formatDescription(description)}
    </div>
  );
}

export function formatTextWithBreaks(text: string | undefined | null): string {
  if (!text) return '';
  return text;
}