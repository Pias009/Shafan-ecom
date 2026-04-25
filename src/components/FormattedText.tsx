interface FormattedTextProps {
  content: string;
  className?: string;
}

export function FormattedText({ content, className = '' }: FormattedTextProps) {
  if (!content) return null;

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
      if (listItems.length > 0) {
        if (listType === 'ol') {
          elements.push(
            <ol key={`ol-${elements.length}`} className="list-decimal ml-5 space-y-1">
              {listItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} className="list-disc ml-5 space-y-1">
              {listItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
        }
        listItems = [];
        listType = null;
        inList = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={idx} className="text-lg font-bold mt-4 mb-2 text-black">
            {trimmed.replace('## ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={idx} className="text-base font-semibold mt-3 mb-1 text-black">
            {trimmed.replace('### ', '')}
          </h3>
        );
      } else if (trimmed === '---') {
        flushList();
        elements.push(<hr key={idx} className="my-4 border-t border-black/20" />);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        inList = true;
        listType = 'ul';
        listItems.push(trimmed.replace(/^[-•] /, ''));
      } else if (/^\d+\.\s/.test(trimmed)) {
        inList = true;
        listType = 'ol';
        listItems.push(trimmed.replace(/^\d+\.\s/, ''));
      } else if (trimmed.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={idx} className="border-l-4 border-black/30 pl-3 py-1 my-2 italic text-black/70">
            {trimmed.replace('> ', '')}
          </blockquote>
        );
      } else if (trimmed) {
        flushList();
        let formattedLine = trimmed
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/__(.+?)__/g, '<strong>$1</strong>')
          .replace(/_(.+?)_/g, '<em>$1</em>')
          .replace(/<u>(.+?)<\/u>/g, '<u>$1</u>')
          .replace(/<(.+?)>/g, '<$1>');

        elements.push(
          <p 
            key={idx} 
            className="mb-2 text-black/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className={`formatted-text ${className}`}>
      {parseMarkdown(content)}
    </div>
  );
}