import React from 'react';
import mermaid from 'mermaid';
import { Code2, Image, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { cn } from '../lib/utils';

let initialized = false;
function ensureInit() {
  if (initialized) return;
  initialized = true;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      background: '#0c0c0c',
      mainBkg: '#141414',
      primaryColor: '#8B1414',
      primaryTextColor: '#eeeeee',
      primaryBorderColor: '#333333',
      lineColor: '#555555',
      secondaryColor: '#1a1a1a',
      tertiaryColor: '#1f1f1f',
      edgeLabelBackground: '#0c0c0c',
      clusterBkg: '#141414',
      titleColor: '#cccccc',
      nodeTextColor: '#dddddd',
      fontFamily: 'Calibri, system-ui, sans-serif',
    },
    flowchart: { curve: 'basis', htmlLabels: true },
    securityLevel: 'loose',
  });
}

let _idCounter = 0;

interface Props {
  code: string;
}

export default function MermaidDiagram({ code }: Props) {
  const [view, setView] = React.useState<'visual' | 'code'>('visual');
  const [svg, setSvg] = React.useState('');
  const [error, setError] = React.useState('');
  const [zoom, setZoom] = React.useState(1);
  const [rendering, setRendering] = React.useState(true);
  const id = React.useRef(`mermaid-cr-${++_idCounter}`).current;

  React.useEffect(() => {
    ensureInit();
    let cancelled = false;
    setRendering(true);
    setError('');
    setSvg('');

    mermaid.render(id, code.trim()).then(({ svg: rendered }) => {
      if (!cancelled) { setSvg(rendered); setRendering(false); }
    }).catch((e: Error) => {
      if (!cancelled) { setError(e.message || 'Render failed'); setRendering(false); }
    });

    return () => { cancelled = true; };
  }, [code, id]);

  const exportSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'diagram.svg'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportPng = () => {
    if (!svg) return;
    const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = (img.naturalWidth || 800) * scale;
      canvas.height = (img.naturalHeight || 400) * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.fillStyle = '#0c0c0c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'diagram.png';
      a.click();
    };
    img.src = encoded;
  };

  return (
    <div className="my-3 bg-[#0c0c0c] border border-border/60 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141414] border-b border-border/40">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('visual')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
              view === 'visual' ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <Image size={11} /> Visual
          </button>
          <button
            onClick={() => setView('code')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
              view === 'code' ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <Code2 size={11} /> Code
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.min(+(z + 0.25).toFixed(2), 3))}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all" title="Zoom in">
            <ZoomIn size={12} />
          </button>
          <span className="text-[10px] font-mono text-muted-foreground/60 w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(+(z - 0.25).toFixed(2), 0.25))}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all" title="Zoom out">
            <ZoomOut size={12} />
          </button>
          <button onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all" title="Reset zoom">
            <RotateCcw size={12} />
          </button>
          <div className="w-px h-4 bg-border/40 mx-1" />
          <button onClick={exportSvg}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all" title="Export SVG">
            <Download size={10} /> SVG
          </button>
          <button onClick={exportPng}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all" title="Export PNG">
            <Download size={10} /> PNG
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'visual' ? (
        <div className="overflow-auto p-4" style={{ maxHeight: 420, cursor: zoom > 1 ? 'grab' : 'default' }}>
          {rendering && (
            <div className="flex items-center gap-2 py-6 justify-center">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
              <span className="text-[11px] text-muted-foreground ml-1">Rendering diagram...</span>
            </div>
          )}
          {error && !rendering && (
            <div className="px-4 py-3 text-[12px] text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              <span className="font-bold">Render error:</span> {error}
            </div>
          )}
          {svg && !rendering && (
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>
      ) : (
        <pre className="p-4 text-[12px] font-mono text-foreground/80 overflow-x-auto whitespace-pre layaa-scroll" style={{ maxHeight: 420 }}>
          {code}
        </pre>
      )}
    </div>
  );
}
