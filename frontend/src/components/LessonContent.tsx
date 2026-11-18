import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./LessonContent.css";

export default function LessonContent({ content }: { content: string }) {
  return (
    <div className="lesson-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="lesson-markdown-table">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}