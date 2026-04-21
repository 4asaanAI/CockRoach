import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileDown, Copy, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EXPORT_FORMATS } from '../lib/file-export';
import { toast } from 'sonner';

interface DocumentViewerProps {
  content: string;
  onClose: () => void;
}

export default function DocumentViewer({ content, onClose }: DocumentViewerProps) {
  const [exporting, setExporting] = React.useState<string | null>(null);
  const [showFormats, setShowFormats] = React.useState(false);
  const filename = `cockroach-${new Date().toISOString().slice(0, 10)}`;

  const handleExport = async (fmt: typeof EXPORT_FORMATS[number]) => {
    setExporting(fmt.ext);
    setShowFormats(false);
    try {
      await (fmt.fn as any)(content, filename);
      toast.success(`Downloaded as .${fmt.ext}`);
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="flex flex-col h-full w-full bg-[#111] border-l border-white/8 overflow-hidden"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/8 bg-[#141414] shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-primary" />
          <span className="text-[13px] font-bold text-foreground tracking-tight">Document</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(content); toast.success('Copied!'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-mid border border-border hover:border-primary/40 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all uppercase tracking-wider"
          >
            <Copy size={11} />
            Copy all
          </button>
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFormats(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 hover:bg-primary/20 rounded-lg text-[11px] font-bold text-primary transition-all uppercase tracking-wider"
            >
              <FileDown size={11} />
              {exporting ? `Exporting...` : 'Export'}
              {showFormats ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            <AnimatePresence>
              {showFormats && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {EXPORT_FORMATS.map(fmt => (
                    <button
                      key={fmt.ext}
                      onClick={() => handleExport(fmt)}
                      disabled={!!exporting}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-40 text-left"
                    >
                      <span className="font-mono text-[10px] text-primary font-bold w-8">.{fmt.ext}</span>
                      <span>{fmt.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto px-8 py-8 layaa-scroll">
        <div className="max-w-2xl mx-auto prose-document">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-2xl font-black text-foreground mt-6 mb-3 first:mt-0 pb-2 border-b border-primary/20">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold text-foreground mt-6 mb-2 first:mt-0 pb-1.5 border-b border-border/40">{children}</h2>,
              h3: ({ children }) => <h3 className="text-[16px] font-bold text-foreground mt-5 mb-2">{children}</h3>,
              h4: ({ children }) => <h4 className="text-[14px] font-semibold text-foreground/90 mt-4 mb-1.5">{children}</h4>,
              p: ({ children }) => <p className="text-[14px] text-foreground/80 leading-7 mb-4 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="my-3 space-y-1.5 pl-0 list-none">{children}</ul>,
              ol: ({ children }) => <ol className="my-3 space-y-1.5 list-decimal pl-5">{children}</ol>,
              li: ({ children }) => (
                <li className="text-[14px] text-foreground/80 leading-6 flex gap-2 items-start">
                  <span className="text-primary mt-1.5 shrink-0">›</span>
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
              em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-3 border-primary pl-4 my-4 text-muted-foreground italic bg-primary/5 py-2 pr-3 rounded-r-lg">{children}</blockquote>
              ),
              code: ({ children, className }: any) => {
                const isBlock = className?.includes('language-');
                return isBlock
                  ? <code className="block bg-[#0c0c0c] border border-border/60 rounded-lg p-4 text-[12px] font-mono text-foreground overflow-x-auto my-4 whitespace-pre">{children}</code>
                  : <code className="bg-surface-mid border border-border/60 rounded px-1.5 py-0.5 text-[12px] font-mono text-primary">{children}</code>;
              },
              pre: ({ children }) => <>{children}</>,
              table: ({ children }) => (
                <div className="my-5 overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-[13px]">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-primary/10">{children}</thead>,
              th: ({ children }) => <th className="text-left px-4 py-2.5 font-bold text-[11px] text-primary uppercase tracking-wider border-b border-border/60">{children}</th>,
              td: ({ children }) => <td className="px-4 py-2.5 text-foreground/80 border-b border-border/30 last:border-b-0">{children}</td>,
              tr: ({ children }) => <tr className="hover:bg-card/30 transition-colors">{children}</tr>,
              hr: () => <hr className="my-6 border-border/40" />,
              a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:brightness-110">{children}</a>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
