import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * Renders markdown content with GitHub Flavored Markdown support
 * Sanitized and safe for user-generated content
 */
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize rendering if needed
          p: ({ children }) => <p style={{ margin: "0 0 0.75rem 0" }}>{children}</p>,
          ul: ({ children }) => (
            <ul style={{ margin: "0 0 0.75rem 0", paddingLeft: "1.5rem" }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: "0 0 0.75rem 0", paddingLeft: "1.5rem" }}>{children}</ol>
          ),
          li: ({ children }) => <li style={{ marginBottom: "0.375rem" }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
          em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4a90d9", textDecoration: "underline" }}
            >
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
