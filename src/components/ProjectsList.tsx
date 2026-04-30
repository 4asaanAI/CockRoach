import React from 'react';
import { motion } from 'motion/react';
import { FolderKanban, Plus, Calendar, ArrowRight } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { cn } from '../lib/utils';
import { PROJECT_STAGES } from '../lib/types';
import type { Project, ProjectStage } from '../lib/types';
import CreateProjectModal from './projects/CreateProjectModal';

interface Props {
  userId: string | null;
  onOpenProject: (id: string) => void;
}

const STAGE_FILTERS: { id: 'active' | 'all' | ProjectStage; label: string }[] = [
  { id: 'active',    label: 'Active' },
  { id: 'all',       label: 'All' },
  { id: 'idea',      label: 'Ideas' },
  { id: 'building',  label: 'Building' },
  { id: 'launched',  label: 'Launched' },
  { id: 'paused',    label: 'Paused' },
  { id: 'archived',  label: 'Archived' },
];

const STAGE_ACCENT: Record<ProjectStage, { bg: string; text: string; border: string }> = {
  idea:      { bg: 'bg-blue-950/40',   text: 'text-blue-300',   border: 'border-blue-500/25' },
  validated: { bg: 'bg-violet-950/40', text: 'text-violet-300', border: 'border-violet-500/25' },
  building:  { bg: 'bg-amber-950/40',  text: 'text-amber-300',  border: 'border-amber-500/25' },
  launched:  { bg: 'bg-emerald-950/40',text: 'text-emerald-300',border: 'border-emerald-500/25' },
  scaling:   { bg: 'bg-primary-bg',    text: 'text-primary',    border: 'border-primary/25' },
  paused:    { bg: 'bg-surface-mid',   text: 'text-muted-foreground', border: 'border-border' },
  archived:  { bg: 'bg-surface-mid/50',text: 'text-muted-foreground/60', border: 'border-border' },
};

function ProjectCardSkeleton() {
  return (
    <div className="layaa-card bg-card/50 backdrop-blur-sm p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-20 rounded-full bg-surface-mid" />
        <div className="h-4 w-32 rounded bg-surface-mid" />
      </div>
      <div className="h-3 w-3/4 rounded bg-surface-mid" />
      <div className="h-3 w-1/2 rounded bg-surface-mid" />
    </div>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const accent = STAGE_ACCENT[project.stage];
  const stageLabel = PROJECT_STAGES.find(s => s.id === project.stage)?.label ?? project.stage;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="layaa-card layaa-card-interactive bg-card/50 backdrop-blur-sm p-5 text-left group flex flex-col hover:border-primary/40 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border',
            accent.bg, accent.text, accent.border,
          )}
        >
          {stageLabel}
        </span>
        <ArrowRight size={14} className="text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>

      <h3 className="text-base font-bold text-foreground mb-1 truncate">{project.name}</h3>
      {project.description && (
        <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
      )}

      <div className="mt-auto flex items-center gap-3 text-[10px] text-muted-foreground/60 pt-2 border-t border-border/40">
        <span className="flex items-center gap-1">
          <Calendar size={10} />
          updated {relativeTime(project.updated_at)}
        </span>
      </div>
    </motion.button>
  );
}

export default function ProjectsList({ userId, onOpenProject }: Props) {
  const { projects, loading, error, create } = useProjects({ userId });
  const [filter, setFilter] = React.useState<typeof STAGE_FILTERS[number]['id']>('active');
  const [modalOpen, setModalOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (filter === 'all') return projects;
    if (filter === 'active') {
      return projects.filter(p => p.stage !== 'paused' && p.stage !== 'archived');
    }
    return projects.filter(p => p.stage === filter);
  }, [projects, filter]);

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-foreground tracking-tight">Projects</h1>
          <p className="text-[12px] text-muted-foreground">
            Each project is a venture. Decisions, artifacts, and chats compound here.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-background rounded-xl text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(var(--primary),0.3)]"
        >
          <Plus size={13} strokeWidth={3} />
          New project
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STAGE_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border transition-all',
              filter === f.id
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-surface-mid text-muted-foreground border-border hover:text-foreground hover:border-primary/20'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Body */}
      {loading && projects.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : error ? (
        <div className="layaa-card bg-destructive/5 border-destructive/20 p-6 text-center">
          <p className="text-[13px] text-destructive font-medium">Couldn't load projects</p>
          <p className="text-[11px] text-muted-foreground mt-1">{error}</p>
        </div>
      ) : filtered.length === 0 && projects.length === 0 ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
      ) : filtered.length === 0 ? (
        <div className="layaa-card bg-card/30 border-border p-8 text-center space-y-2">
          <p className="text-[13px] text-foreground font-medium">Nothing here yet</p>
          <p className="text-[11px] text-muted-foreground">No projects in <span className="text-foreground font-medium">{STAGE_FILTERS.find(f => f.id === filter)?.label}</span>. Try a different filter or create a new one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} onOpen={() => onOpenProject(p.id)} />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={async (input) => {
          const project = await create(input);
          if (project) onOpenProject(project.id);
          return project;
        }}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
      <FolderKanban size={48} className="text-primary/40" />
      <div className="space-y-1">
        <h2 className="text-base font-bold text-foreground">No projects yet</h2>
        <p className="text-[12px] text-muted-foreground max-w-sm">
          A project is the spine for one venture. Decisions, artifacts, chats, and weekly pulse logs all compound under it.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-background rounded-xl text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
      >
        <Plus size={13} strokeWidth={3} />
        Start your first project
      </button>
    </div>
  );
}
