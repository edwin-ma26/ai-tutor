import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  className?: string;
}

export default function MathRenderer({ content, className = "" }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Parse and render math expressions
    const renderMath = (text: string): string => {
      // Handle display math ($$...$$)
      text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, mathContent) => {
        try {
          const rendered = katex.renderToString(mathContent.trim(), {
            displayMode: true,
            throwOnError: false,
            strict: false,
          });
          return `<div class="math-display">${rendered}</div>`;
        } catch (error) {
          console.warn('KaTeX display math error:', error);
          return `<div class="math-error">$$${mathContent}$$</div>`;
        }
      });

      // Handle inline math ($...$)
      text = text.replace(/\$([^$\n]+?)\$/g, (match, mathContent) => {
        try {
          const rendered = katex.renderToString(mathContent.trim(), {
            displayMode: false,
            throwOnError: false,
            strict: false,
          });
          return `<span class="math-inline">${rendered}</span>`;
        } catch (error) {
          console.warn('KaTeX inline math error:', error);
          return `<span class="math-error">$${mathContent}$</span>`;
        }
      });

      return text;
    };

    // Render the content with math
    const renderedContent = renderMath(content);
    
    // Convert line breaks to proper HTML
    const htmlContent = renderedContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('');

    container.innerHTML = htmlContent;
    
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className={`math-content ${className}`}
      style={{
        lineHeight: '1.6',
      }}
    />
  );
}