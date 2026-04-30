import { motion } from 'motion/react';
import { Inbox, AlertTriangle, Clock, FileWarning, MoonStar } from 'lucide-react';
import { useDecisions } from '../../hooks/useDecisions';
import { usePulseLog } from '../../hooks/usePulseLog';
import { useProjectInbox } from '../../hooks/useProjectInbox';
import type { InboxItem } from '../../hooks/useProjectInbox';
import type { Project, Decision } from '../../lib/types';
import { cn } from '../../lib/utils';

interface Props {
  project: Project;
}

const SEVERITY_BADGE: Record<InboxItem['severity'], string> = {
  high:   'bg-destructive/15 text-destructive border-destructive/30',
  medium: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
  low:    'bg-surface-mid text-muted-foreground border-border',
};

const KIND_ICON = {
  revisit_due:        Clock,
  decay_near:         AlertTriangle,
  pulse_overdue:      FileWarning,
  no_recent_activity: MoonStar,
} as const;

export default function InboxTab({ project }: Props) {
  const { decisions, loading: decisionsLoading } = useDecisions({ projectId: project.id });
  const { pulseLogs, loading: pulseLoading } = usePulseLog({ projectId: project.id });

  const items = useProjectInbox({ project, decisions, pulseLogs });

  if (decisionsLoading || pulseLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map(i => (
          <div key={i} className="h-16 rounded-xl bg-surface-mid/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="layaa-card bg-card/30 border-border p-8 text-center space-y-2">
        <Inbox size={28} className="text-muted-foreground/40 mx-auto" />
        <p className="text-[13px] text-foreground font-medium">Inbox is clear</p>
        <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
          No decisions due to revisit, no decay timers nearing, no overdue pulse logs. Project is healthy.
        </p>
      </div>
    );
  }

  // Build decision lookup once
  const decisionById = new Map<string, Decision>(decisions.map(d => [d.id, d]));

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const Icon = KIND_ICON[item.kind];
        const decision = item.decisionId ? decisionById.get(item.decisionId) : null;
        return (
          <motion.div
            key={`${item.kind}-${item.decisionId ?? i}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="layaa-card bg-card/50 backdrop-blur-sm p-4 space-y-2"
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-1.5 rounded-lg shrink-0 mt-0.5',
                item.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                item.severity === 'medium' ? 'bg-amber-950/40 text-amber-300' :
                'bg-surface-mid text-muted-foreground'
              )}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[13px] font-bold text-foreground line-clamp-1">{item.title}</h3>
                  <span className={cn(
                    'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border shrink-0',
                    SEVERITY_BADGE[item.severity]
                  )}>
                    {item.severity}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.detail}</p>
                {decision && (
                  <p className="text-[10px] text-muted-foreground/60 mt-2 pt-2 border-t border-border/40 italic">
                    Original decision: "{decision.decision.slice(0, 120)}{decision.decision.length > 120 ? '…' : ''}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
