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
    
    // Parse and render math expressions and formatting
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

      // Handle bold text (**text**)
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      return text;
    };

    // Render the content with math
    const renderedContent = renderMath(content);
    
    // Convert line breaks to proper HTML with bullet point support
    const lines = renderedContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    let htmlContent = '';
    let inList = false;
    
    for (const line of lines) {
      // Check if line starts with asterisk (bullet point)
      if (line.startsWith('*') && !line.startsWith('**')) {
        const bulletContent = line.substring(1).trim();
        
        if (!inList) {
          htmlContent += '<ul class="list-disc list-inside space-y-1 ml-4">';
          inList = true;
        }
        
        htmlContent += `<li>${bulletContent}</li>`;
      } else {
        if (inList) {
          htmlContent += '</ul>';
          inList = false;
        }
        htmlContent += `<p>${line}</p>`;
      }
    }
    
    // Close any remaining open list
    if (inList) {
      htmlContent += '</ul>';
    }

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