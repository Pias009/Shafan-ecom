'use client';

import { useEffect, useState } from 'react';

const BLOCKS = [
  {
    delay: 0,
    lines: [
      { align: 'center' as const, size: 'clamp(2rem,4.5vw,3.8rem)', font: "'Playfair Display',serif", italic: true,  color: '#fff',                   words: ['Your', 'identity.', 'Your', 'clean', '&', 'healthy', 'skin.'] },
      { align: 'center' as const, size: 'clamp(0.85rem,1.5vw,1.1rem)', font: 'Inter,sans-serif',       italic: false, color: 'rgba(255,255,255,0.4)', words: ['If', 'you', 'are', 'destroyed', '—', 'no', 'worry.'] },
    ],
  },
  {
    delay: 2200,
    lines: [
      { align: 'left'  as const, size: 'clamp(2rem,4.5vw,3.8rem)',    font: "'Playfair Display',serif", italic: true,  color: '#fff',                    words: ['Think', 'your', 'skin', 'is', 'a', 'dead', 'tree.'] },
      { align: 'right' as const, size: 'clamp(0.85rem,1.5vw,1.1rem)', font: 'Inter,sans-serif',         italic: false, color: 'rgba(255,255,255,0.42)', words: ['But', 'it', 'can', 'grow', 'again', '—', 'from', 'within,', 'like', 'baby', 'skin.'] },
    ],
  },
  {
    delay: 4600,
    lines: [
      { align: 'center' as const, size: 'clamp(1.1rem,2.2vw,1.7rem)', font: 'Inter,sans-serif', italic: false, color: 'rgba(255,255,255,0.75)', words: ['We', 'are', 'Shanfa', 'Global.'] },
      { align: 'center' as const, size: 'clamp(0.78rem,1.3vw,1rem)',   font: 'Inter,sans-serif', italic: false, color: 'rgba(255,255,255,0.35)', words: ['Presenting', 'your', 'AI', 'skincare', 'partner', '—', 'Doctor', 'Sesi.'] },
    ],
  },
];

const WORD_GAP = 90;
const TOTAL_MS = 7200;

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [blockIdx,   setBlockIdx]   = useState(0);
  const [wordCounts, setWordCounts] = useState<number[]>([0, 0]);
  const [exiting,    setExiting]    = useState(false);
  const [hovered,    setHovered]    = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BLOCKS.forEach((block, bi) => {
      const bt = setTimeout(() => {
        setBlockIdx(bi);
        setWordCounts([0, 0]);
        block.lines.forEach((line, li) => {
          line.words.forEach((_, wi) => {
            const wt = setTimeout(() =>
              setWordCounts(prev => {
                const next = [...prev];
                next[li] = wi + 1;
                return next;
              }),
              li * 200 + wi * WORD_GAP
            );
            timers.push(wt);
          });
        });
      }, block.delay);
      timers.push(bt);
    });

    const exitT = setTimeout(() => {
      setExiting(true);
      setTimeout(onDone, 800);
    }, TOTAL_MS);
    timers.push(exitT);

    return () => timers.forEach(clearTimeout);
  }, []);

  const block = BLOCKS[blockIdx];

  return (
    <div
      className="grain"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#040406',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 8vw', gap: '1rem',
        animation: exiting ? 'loader-out 0.8s ease forwards' : 'none',
        pointerEvents: exiting ? 'none' : 'all',
        overflow: 'hidden',
      }}
    >
      {/* progress bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, height: 1, background: 'rgba(255,255,255,0.08)', width: '100%' }}>
        <div style={{
          height: '100%', background: 'rgba(255,255,255,0.35)',
          animation: `line-grow ${TOTAL_MS}ms linear forwards`, width: 0,
        }} />
      </div>

      {/* eyebrow */}
      <p style={{
        position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)',
        margin: 0, color: 'rgba(255,255,255,0.18)',
        fontSize: '0.55rem', letterSpacing: '0.38em', textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>Doctor Sasi · Clinical Skincare</p>

      {/* word-by-word lines */}
      <div style={{ width: '100%', maxWidth: 820, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {block.lines.map((line, li) => (
          <div key={`${blockIdx}-${li}`} style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.28em',
            justifyContent: line.align === 'center' ? 'center' : line.align === 'right' ? 'flex-end' : 'flex-start',
          }}>
            {line.words.slice(0, wordCounts[li] ?? 0).map((word, wi) => (
              <span key={`${blockIdx}-${li}-${wi}`} style={{
                display: 'inline-block',
                fontFamily: line.font,
                fontStyle: line.italic ? 'italic' : 'normal',
                fontSize: line.size,
                color: line.color,
                lineHeight: 1.25,
                animation: 'wrd-in 0.45s cubic-bezier(0.16,1,0.3,1) both',
              }}>{word}</span>
            ))}
          </div>
        ))}
      </div>

      {/* hover reveal */}
      <div style={{
        position: 'absolute', bottom: '14%', textAlign: 'center',
        transition: 'opacity 0.5s ease',
        opacity: hovered ? 1 : 0.12, pointerEvents: 'none',
      }}>
        <p style={{
          margin: '0 0 4px',
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          fontSize: 'clamp(0.9rem,1.8vw,1.3rem)', color: '#fff',
        }}>Dead skin on the surface.</p>
        <p style={{
          margin: 0,
          fontFamily: "'Playfair Display',serif", fontStyle: 'italic',
          fontSize: 'clamp(0.9rem,1.8vw,1.3rem)', color: 'rgba(255,255,255,0.7)',
        }}>But the inner skin is alive — let&apos;s grow it again.</p>
      </div>

      {/* bottom label */}
      <p style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        margin: 0, color: 'rgba(255,255,255,0.1)',
        fontSize: '0.52rem', letterSpacing: '0.3em', textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>Shanfa Global</p>
    </div>
  );
}
