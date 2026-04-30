import React from 'react';
import { ChevronDown, FolderKanban, Plus, X } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { cn } from '../../lib/utils';
import type { Project } from '../../lib/types';

interface Props {
  userId: string | null;
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onOpenAll: () => void;
  onCreateNew: () => void;
}

/**
 * Top-of-sidebar project switcher (Notion workspace-switcher pattern).
 * Higher discoverability than chat-header switchers per 2026 SaaS UI
 * research.
 */
export default function ProjectSwitcher({
  userId,
  activeProjectId,
  onSelectProject,
  onOpenAll,
  onCreateNew,
}: Props) {
  const { projects, loading } = useProjects({ userId });
  const [open, setOpen] = React.useState(false);

  const active: Project | null = React.useMemo(
    () => projects.find(p => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const activeProjects = React.useMemo(
    () => projects.filter(p => p.stage !== 'archived' && p.stage !== 'paused'),
    [projects],
  );

  return (
    <div className="px-3 pt-3 relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left',
          active
            ? 'bg-primary/10 text-foreground border-primary/30'
            : 'bg-surface-mid text-muted-foreground border-border hover:border-primary/20'
        )}
      >
        <FolderKanban size={13} className={active ? 'text-primary' : 'text-muted-foreground/60'} />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">
            {active ? 'Active project' : 'No project'}
          </p>
          <p className="text-[12px] font-bold text-foreground truncate mt-0.5">
            {active ? active.name : 'Pick or create one'}
          </p>
        </div>
        {active && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelectProject(null); }}
            className="p-0.5 text-muted-foreground/60 hover:text-destructive rounded transition-all"
            title="Clear active project"
          >
            <X size={11} />
          </button>
        )}
        <ChevronDown size={11} className={cn('text-muted-foreground/60 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-3 right-3 top-full mt-1 z-40 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto layaa-scroll">
            {loading && projects.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-muted-foreground">Loading…</div>
            ) : activeProjects.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-muted-foreground">No active projects yet</div>
            ) : (
              <div className="py-1">
                {activeProjects.slice(0, 8).map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onSelectProject(p.id); setOpen(false); }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-[12px] hover:bg-white/5 transition-all',
                      p.id === activeProjectId ? 'text-primary font-medium' : 'text-foreground'
                    )}
                  >
                    <p className="truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">{p.stage}</p>
                  </button>
                ))}
                {activeProjects.length > 8 && (
                  <p className="px-3 py-1 text-[10px] text-muted-foreground/60 italic">…and {activeProjects.length - 8} more</p>
                )}
              </div>
            )}
            <div className="border-t border-border/40 py-1 bg-surface-mid/30">
              <button
                onClick={() => { onOpenAll(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-[11px] text-foreground hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <FolderKanban size={11} />
                Manage all projects
              </button>
              <button
                onClick={() => { onCreateNew(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-[11px] text-primary hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <Plus size={11} strokeWidth={3} />
                Create new project
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
