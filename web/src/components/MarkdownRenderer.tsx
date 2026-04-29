import ReactMarkdown from 'react-markdown'
import type { ReactNode } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-stone dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }: { children?: ReactNode }) => (
            <h1 className="font-display text-2xl font-medium text-ink dark:text-ink-dark mb-4 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }: { children?: ReactNode }) => (
            <h2 className="font-display text-xl font-medium text-ink dark:text-ink-dark mt-6 mb-3 pb-2 border-b border-primary/30">
              {children}
            </h2>
          ),
          h3: ({ children }: { children?: ReactNode }) => (
            <h3 className="font-sans text-base font-semibold text-ink dark:text-ink-dark mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }: { children?: ReactNode }) => (
            <p className="text-body dark:text-body-dark leading-relaxed mb-4">
              {children}
            </p>
          ),
          code: ({ node, className, children, ...props }: { node?: any, className?: string, children?: ReactNode }) => {
            const inline = !className
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <div className="my-4 rounded-xl overflow-hidden bg-[#1e1e1e]">
                <div className="flex items-center px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
                  <span className="text-xs text-muted dark:text-muted-dark">{match[1]}</span>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '16px',
                    background: 'transparent',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="px-1.5 py-0.5 rounded bg-soft dark:bg-soft-dark text-sm font-mono text-primary"
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
          ul: ({ children }: { children?: ReactNode }) => (
            <ul className="list-disc list-inside text-body dark:text-body-dark mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }: { children?: ReactNode }) => (
            <ol className="list-decimal list-inside text-body dark:text-body-dark mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }: { children?: ReactNode }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }: { children?: ReactNode }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-soft/50 dark:bg-soft-dark/50 rounded-r-lg">
              {children}
            </blockquote>
          ),
          a: ({ href, children }: { href?: string, children?: ReactNode }) => (
            <a
              href={href}
              className="text-primary hover:text-primary-active underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }: { src?: string, alt?: string }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full rounded-lg shadow-md my-4"
            />
          ),
          table: ({ children }: { children?: ReactNode }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }: { children?: ReactNode }) => (
            <thead className="bg-soft dark:bg-soft-dark">{children}</thead>
          ),
          th: ({ children }: { children?: ReactNode }) => (
            <th className="px-4 py-2 text-left font-semibold text-ink dark:text-ink-dark border-b border-hairline dark:border-hairline-dark">
              {children}
            </th>
          ),
          td: ({ children }: { children?: ReactNode }) => (
            <td className="px-4 py-2 text-body dark:text-body-dark border-b border-hairline dark:border-hairline-dark">
              {children}
            </td>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
