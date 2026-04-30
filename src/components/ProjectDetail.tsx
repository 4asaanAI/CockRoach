import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MessageSquare, Brain, FileText, Inbox, Pencil, Check, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '../hooks/useProjects';
import { cn } from '../lib/utils';
import { PROJECT_STAGES } from '../lib/types';
import type { Project, ProjectStage } from '../lib/types';
import ChatsTab from './projects/ChatsTab';
import DecisionsTab from './projects/DecisionsTab';
import ArtifactsTab from './projects/ArtifactsTab';
import InboxTab from './projects/InboxTab';

interface Props {
  projectId: string;
  userId: string;
  onBack: () => void;
  onOpenChat: (chatId: string) => void;
}

type Tab = 'chats' | 'decisions' | 'artifacts' | 'inbox';

const TABS: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
  { id: 'chats',     label: 'Chats',     icon: MessageSquare },
  { id: 'decisions', label: 'Decisions', icon: Brain },
  { id: 'artifacts', label: 'Artifacts', icon: FileText },
  { id: 'inbox',     label: 'Inbox',     icon: Inbox },
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

function ProjectHeader({
  project,
  onUpdateStage,
  onEditName,
  onArchive,
}: {
  project: Project;
  onUpdateStage: (stage: ProjectStage) => void;
  onEditName: (name: string) => void;
  onArchive: () => void;
}) {
  const [editingName, setEditingName] = React.useState(false);
  const [draftName, setDraftName] = React.useState(project.name);
  const [stageMenuOpen, setStageMenuOpen] = React.useState(false);

  React.useEffect(() => { setDraftName(project.name); }, [project.name]);

  const accent = STAGE_ACCENT[project.stage];
  const stageMeta = PROJECT_STAGES.find(s => s.id === project.stage);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0 space-y-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { onEditName(draftName); setEditingName(false); }
                  if (e.key === 'Escape') { setDraftName(project.name); setEditingName(false); }
                }}
                className="flex-1 bg-background border border-primary/40 rounded-lg px-3 py-1.5 text-xl font-black text-foreground focus:outline-none"
              />
              <button
                onClick={() => { onEditName(draftName); setEditingName(false); }}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-2xl font-black text-foreground tracking-tight">{project.name}</h1>
              <button
                onClick={() => setEditingName(true)}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded-lg transition-all"
                aria-label="Rename"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
          {project.description && (
            <p className="text-[13px] text-muted-foreground">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Stage selector */}
          <div className="relative">
            <button
              onClick={() => setStageMenuOpen(s => !s)}
              className={cn(
                'text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all',
                accent.bg, accent.text, accent.border, 'hover:brightness-110'
              )}
              title={stageMeta?.description}
            >
              {stageMeta?.label}
            </button>
            {stageMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStageMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                  {PROJECT_STAGES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { onUpdateStage(s.id); setStageMenuOpen(false); }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-[11px] font-medium hover:bg-white/5 transition-all',
                        s.id === project.stage ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {project.stage !== 'archived' && (
            <button
              onClick={onArchive}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
              title="Archive"
            >
              <Archive size={14} />
            </button>
          )}
        </div>
      </div>

      <KpiStrip project={project} />
    </div>
  );
}

function KpiStrip({ project }: { project: Project }) {
  // health_score is jsonb; we stub four KPI tiles. As pulse_log entries
  // accumulate the values flow in from health_delta.
  const score = project.health_score;
  const tiles: { label: string; value: string; tone?: string }[] = [
    {
      label: 'Created',
      value: new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },
    {
      label: 'Last activity',
      value: relativeTime(project.updated_at),
    },
    {
      label: 'Health',
      value: typeof score?.composite === 'number' ? `${Math.round(score.composite)}/100` : '—',
      tone: typeof score?.composite === 'number'
        ? score.composite >= 70 ? 'text-emerald-300'
        : score.composite >= 40 ? 'text-amber-300'
        : 'text-destructive'
        : 'text-muted-foreground',
    },
    {
      label: 'Pulse',
      value: project.last_pulse_at
        ? relativeTime(project.last_pulse_at)
        : '—',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {tiles.map(t => (
        <div key={t.label} className="layaa-card bg-card/40 border border-border/40 p-3">
          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{t.label}</p>
          <p className={cn('text-base font-bold mt-1', t.tone ?? 'text-foreground')}>{t.value}</p>
        </div>
      ))}
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
  if (diffDay < 14) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProjectDetail({ projectId, userId, onBack, onOpenChat }: Props) {
  const { byId, update, archive } = useProjects({ userId });
  const project = byId(projectId);
  const [activeTab, setActiveTab] = React.useState<Tab>('chats');

  if (!project) {
    // Project list still loading or project not found
    return (
      <div className="max-w-3xl mx-auto p-8 space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft size={11} /> Back to projects
        </button>
        <div className="layaa-card bg-card/30 border-border p-8 text-center space-y-2">
          <p className="text-[13px] text-foreground font-medium">Loading project…</p>
          <p className="text-[11px] text-muted-foreground">If this hangs, the project may have been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
      >
        <ArrowLeft size={11} /> Back to projects
      </button>

      <ProjectHeader
        project={project}
        onUpdateStage={async (stage) => {
          const result = await update(project.id, { stage });
          if (result) toast.success(`Stage updated to "${stage}"`);
        }}
        onEditName={async (name) => {
          if (name.trim() === project.name || !name.trim()) return;
          const result = await update(project.id, { name: name.trim() });
          if (result) toast.success('Project renamed');
        }}
        onArchive={async () => {
          if (!confirm('Archive this project? You can restore it later by changing stage.')) return;
          const ok = await archive(project.id);
          if (ok) {
            toast.success('Project archived');
            onBack();
          }
        }}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/40 -mx-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {activeTab === 'chats' && (
          <ChatsTab projectId={project.id} onOpenChat={onOpenChat} />
        )}
        {activeTab === 'decisions' && (
          <DecisionsTab projectId={project.id} userId={userId} />
        )}
        {activeTab === 'artifacts' && (
          <ArtifactsTab projectId={project.id} />
        )}
        {activeTab === 'inbox' && (
          <InboxTab project={project} />
        )}
      </motion.div>
    </div>
  );
}
