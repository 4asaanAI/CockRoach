import React from 'react';
import { motion } from 'motion/react';
import { Brain, Plus, Clock, AlertTriangle, ChevronRight, List, LayoutGrid } from 'lucide-react';
import { useDecisions } from '../../hooks/useDecisions';
import { DECISION_CATEGORIES } from '../../lib/types';
import type { Decision, Reversibility } from '../../lib/types';
import { cn } from '../../lib/utils';
import DecisionFormModal from './DecisionFormModal';

interface Props {
  projectId: string;
  userId: string;
}

type ViewMode = 'kanban' | 'list';

const REVERSIBILITY_COLUMN_META: Record<Reversibility, { label: string; tone: string; help: string }> = {
  reversible: { label: 'Reversible',   tone: 'border-emerald-500/30 bg-emerald-950/20', help: 'Two-way doors. Move fast.' },
  expensive:  { label: 'Expensive',    tone: 'border-amber-500/30 bg-amber-950/20',     help: 'Reversible but costly.' },
  one_way:    { label: 'One-way door', tone: 'border-destructive/30 bg-destructive/5',   help: 'Hard to undo. Move carefully.' },
};

const REVERSIBILITY_BADGE: Record<Reversibility, string> = {
  reversible: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
  expensive:  'bg-amber-950/40 text-amber-300 border-amber-500/30',
  one_way:    'bg-destructive/15 text-destructive border-destructive/30',
};

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

function isRevisitDue(d: Decision): boolean {
  if (!d.revisit_at || d.outcome_observed) return false;
  return new Date(d.revisit_at) <= new Date();
}

function isDecayNear(d: Decision): boolean {
  if (!d.reversibility_decay_at || d.reversed_at) return false;
  const decay = new Date(d.reversibility_decay_at);
  const now = new Date();
  const days = Math.floor((decay.getTime() - now.getTime()) / 86_400_000);
  return days >= 0 && days <= 7;
}

function DecisionCard({ d }: { d: Decision }) {
  const isReversed = !!d.reversed_at;
  const categoryLabel = DECISION_CATEGORIES.find(c => c.id === d.category)?.label ?? d.category;
  const revisitDue = isRevisitDue(d);
  const decayNear = isDecayNear(d);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-3 rounded-xl border bg-card/50 hover:bg-card/70 hover:border-primary/30 transition-all space-y-2',
        isReversed && 'opacity-50',
      )}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 px-1.5 py-0.5 rounded-full bg-surface-mid">
          {categoryLabel}
        </span>
        {isReversed && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-destructive px-1.5 py-0.5 rounded-full bg-destructive/10 border border-destructive/30">
            Reversed
          </span>
        )}
        {revisitDue && !isReversed && (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-amber-300 px-1.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/30">
            <Clock size={9} /> Revisit due
          </span>
        )}
        {decayNear && !isReversed && (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-destructive px-1.5 py-0.5 rounded-full bg-destructive/10 border border-destructive/30">
            <AlertTriangle size={9} /> Closing
          </span>
        )}
      </div>

      <p className={cn('text-[12px] text-muted-foreground line-clamp-2', isReversed && 'line-through')}>
        {d.question}
      </p>
      <p className={cn('text-[13px] text-foreground font-medium line-clamp-3', isReversed && 'line-through')}>
        {d.decision}
      </p>

      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <span className="text-[10px] text-muted-foreground/60">{relativeTime(d.decided_at)}</span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
          {d.confidence} conf
        </span>
      </div>
    </motion.div>
  );
}

function KanbanColumn({
  reversibility,
  decisions,
}: {
  reversibility: Reversibility;
  decisions: Decision[];
}) {
  const meta = REVERSIBILITY_COLUMN_META[reversibility];
  const sorted = [...decisions].sort((a, b) =>
    new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime()
  );
  return (
    <div className={cn('flex-1 min-w-[260px] flex flex-col rounded-xl border p-3 space-y-2', meta.tone)}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest">{meta.label}</h3>
        <span className="text-[10px] font-mono text-muted-foreground/60">{sorted.length}</span>
      </div>
      <p className="text-[10px] text-muted-foreground/70 italic mb-1">{meta.help}</p>
      <div className="flex-1 space-y-2 overflow-y-auto layaa-scroll max-h-[60vh]">
        {sorted.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/50 text-center py-6">No decisions here yet</p>
        ) : (
          sorted.map(d => <DecisionCard key={d.id} d={d} />)
        )}
      </div>
    </div>
  );
}

function ListView({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) {
    return <p className="text-[12px] text-muted-foreground text-center py-8">No decisions logged yet.</p>;
  }
  const sorted = [...decisions].sort((a, b) =>
    new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime()
  );
  return (
    <div className="space-y-2">
      {sorted.map(d => (
        <div
          key={d.id}
          className={cn(
            'flex items-start gap-3 p-3 rounded-xl border bg-card/40 hover:bg-card/60 hover:border-primary/30 transition-all',
            d.reversed_at && 'opacity-50',
          )}
        >
          <span className={cn('text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border shrink-0', REVERSIBILITY_BADGE[d.reversibility])}>
            {REVERSIBILITY_COLUMN_META[d.reversibility].label}
          </span>
          <div className="flex-1 min-w-0">
            <p className={cn('text-[12px] text-muted-foreground line-clamp-1', d.reversed_at && 'line-through')}>{d.question}</p>
            <p className={cn('text-[13px] text-foreground font-medium line-clamp-2 mt-0.5', d.reversed_at && 'line-through')}>{d.decision}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">{relativeTime(d.decided_at)} · {d.confidence} confidence</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground/40 shrink-0 mt-1" />
        </div>
      ))}
    </div>
  );
}

export default function DecisionsTab({ projectId, userId }: Props) {
  const { decisions, loading, log } = useDecisions({ projectId });
  const [view, setView] = React.useState<ViewMode>('kanban');
  const [modalOpen, setModalOpen] = React.useState(false);

  const grouped = React.useMemo(() => {
    const buckets: Record<Reversibility, Decision[]> = {
      reversible: [],
      expensive: [],
      one_way: [],
    };
    decisions.forEach(d => buckets[d.reversibility].push(d));
    return buckets;
  }, [decisions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-surface-mid border border-border rounded-lg p-0.5">
          <button
            onClick={() => setView('kanban')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all',
              view === 'kanban' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid size={11} /> Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all',
              view === 'list' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List size={11} /> List
          </button>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
        >
          <Plus size={11} strokeWidth={3} /> Log decision
        </button>
      </div>

      {loading && decisions.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-48 rounded-xl bg-surface-mid/40 animate-pulse" />
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <div className="layaa-card bg-card/30 border-border p-8 text-center space-y-3">
          <Brain size={28} className="text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <p className="text-[13px] text-foreground font-medium">No decisions logged yet</p>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Capture each strategic call here with its <span className="text-foreground font-medium">reversibility</span>.
              Reversible decisions: move fast. One-way doors: think twice.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
          >
            <Plus size={11} strokeWidth={3} /> Log first decision
          </button>
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto layaa-scroll pb-2">
          <KanbanColumn reversibility="reversible" decisions={grouped.reversible} />
          <KanbanColumn reversibility="expensive"  decisions={grouped.expensive} />
          <KanbanColumn reversibility="one_way"    decisions={grouped.one_way} />
        </div>
      ) : (
        <ListView decisions={decisions} />
      )}

      <DecisionFormModal
        open={modalOpen}
        projectId={projectId}
        userId={userId}
        onClose={() => setModalOpen(false)}
        onLog={log}
      />
    </div>
  );
}
