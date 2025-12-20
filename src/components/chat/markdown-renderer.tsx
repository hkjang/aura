"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        // Code blocks with syntax highlighting
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match;
          
          if (isInline) {
            return (
              <code
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  color: 'var(--color-primary)'
                }}
                {...props}
              >
                {children}
              </code>
            );
          }

          return (
            <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
          );
        },
        
        // Paragraphs
        p({ children }) {
          return (
            <p style={{ marginBottom: '12px', lineHeight: 1.7 }}>
              {children}
            </p>
          );
        },
        
        // Headings
        h1({ children }) {
          return (
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '24px', marginBottom: '12px', color: 'var(--text-primary)' }}>
              {children}
            </h1>
          );
        },
        h2({ children }) {
          return (
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginTop: '20px', marginBottom: '10px', color: 'var(--text-primary)' }}>
              {children}
            </h2>
          );
        },
        h3({ children }) {
          return (
            <h3 style={{ fontSize: '17px', fontWeight: 600, marginTop: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {children}
            </h3>
          );
        },
        
        // Lists
        ul({ children }) {
          return (
            <ul style={{ marginBottom: '12px', paddingLeft: '24px', listStyleType: 'disc' }}>
              {children}
            </ul>
          );
        },
        ol({ children }) {
          return (
            <ol style={{ marginBottom: '12px', paddingLeft: '24px', listStyleType: 'decimal' }}>
              {children}
            </ol>
          );
        },
        li({ children }) {
          return (
            <li style={{ marginBottom: '4px', lineHeight: 1.7 }}>
              {children}
            </li>
          );
        },
        
        // Blockquote
        blockquote({ children }) {
          return (
            <blockquote style={{
              borderLeft: '3px solid var(--color-primary)',
              paddingLeft: '16px',
              margin: '16px 0',
              color: 'var(--text-secondary)',
              fontStyle: 'italic'
            }}>
              {children}
            </blockquote>
          );
        },
        
        // Links
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-primary)',
                textDecoration: 'underline',
                textUnderlineOffset: '2px'
              }}
            >
              {children}
            </a>
          );
        },
        
        // Tables
        table({ children }) {
          return (
            <div style={{ overflowX: 'auto', margin: '16px 0' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              fontWeight: 600,
              textAlign: 'left'
            }}>
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              textAlign: 'left'
            }}>
              {children}
            </td>
          );
        },
        
        // Strong/Bold
        strong({ children }) {
          return <strong style={{ fontWeight: 600 }}>{children}</strong>;
        },
        
        // Emphasis/Italic
        em({ children }) {
          return <em style={{ fontStyle: 'italic' }}>{children}</em>;
        },
        
        // Horizontal rule
        hr() {
          return <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />;
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// Separate component for code blocks with copy functionality
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', margin: '16px 0' }}>
      {/* Header with language and copy button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#2d2d2d',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottom: '1px solid #3d3d3d'
      }}>
        <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>
          {language}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            color: copied ? '#4ade80' : '#888',
            background: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {copied ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      {/* Code content */}
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          padding: '16px',
          fontSize: '13px',
          lineHeight: 1.6
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
