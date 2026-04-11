import React from 'react';

export function formatDescription(text: string | undefined | null): React.ReactNode {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  
  const addListItems = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm leading-relaxed text-black/60">{item}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const isBulletLine = /^[-•·]/.test(trimmed) || /^\d+\.\s/.test(trimmed);
    
    if (isBulletLine) {
      if (!inList) {
        addListItems();
        inList = true;
      }
      listItems.push(trimmed.replace(/^[-•·]\s*/, '').replace(/^\d+\.\s*/, ''));
    } else {
      addListItems();
      if (trimmed) {
        elements.push(
          <p key={`p-${idx}`} className="text-sm leading-relaxed text-black/60 my-1">
            {trimmed}
          </p>
        );
      }
    }
  });
  
  addListItems();
  return elements.length > 0 ? elements : text;
}

export function formatTextWithBreaks(text: string | undefined | null): string {
  if (!text) return '';
  return text;
}