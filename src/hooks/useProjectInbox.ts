import React from 'react';
import type { Decision, ProjectPulseLog, Project } from '../lib/types';

export type InboxItemKind = 'revisit_due' | 'decay_near' | 'pulse_overdue' | 'no_recent_activity';

export interface InboxItem {
  kind: InboxItemKind;
  title: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
  decisionId?: string;
  daysOverdue?: number;
}

interface UseProjectInboxArgs {
  project: Project | null;
  decisions: Decision[];
  pulseLogs: ProjectPulseLog[];
}

const ONE_DAY_MS = 86_400_000;

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / ONE_DAY_MS);
}

/**
 * Derives an actionable inbox from a project's state. Pure derivation
 * over already-loaded decisions + pulse logs — no extra DB call.
 *
 * Surfaces:
 *   - revisit_due       — decisions whose `revisit_at` has passed and
 *                         no outcome has been observed yet
 *   - decay_near        — decisions whose `reversibility_decay_at` is
 *                         within 7 days, and they haven't been reversed
 *   - pulse_overdue     — projects whose last pulse log is > 9 days old
 *                         (we generate weekly + 2-day grace)
 *   - no_recent_activity — projects with `updated_at` > 21 days ago
 */
export function useProjectInbox({ project, decisions, pulseLogs }: UseProjectInboxArgs): InboxItem[] {
  return React.useMemo<InboxItem[]>(() => {
    if (!project) return [];

    const now = new Date();
    const items: InboxItem[] = [];

    // 1. Revisit-due decisions
    for (const d of decisions) {
      if (!d.revisit_at || d.outcome_observed) continue;
      const due = new Date(d.revisit_at);
      if (due > now) continue;
      const days = daysBetween(due, now);
      items.push({
        kind: 'revisit_due',
        title: `Revisit: ${d.question.slice(0, 80)}`,
        detail: `You committed to revisiting this ${days} day${days === 1 ? '' : 's'} ago. What actually happened?`,
        severity: days > 14 ? 'high' : days > 3 ? 'medium' : 'low',
        decisionId: d.id,
        daysOverdue: days,
      });
    }

    // 2. Decay-near decisions
    for (const d of decisions) {
      if (!d.reversibility_decay_at || d.reversed_at) continue;
      const decay = new Date(d.reversibility_decay_at);
      const diffDays = daysBetween(now, decay);
      if (diffDays < 0) continue; // already past — surface as severity high in revisit if relevant
      if (diffDays > 7) continue;
      items.push({
        kind: 'decay_near',
        title: `Decision becoming irreversible: ${d.question.slice(0, 80)}`,
        detail: `Reversibility window closes in ${diffDays} day${diffDays === 1 ? '' : 's'}. If you want options, change course now.`,
        severity: diffDays <= 2 ? 'high' : diffDays <= 5 ? 'medium' : 'low',
        decisionId: d.id,
      });
    }

    // 3. Pulse log overdue
    const lastPulse = pulseLogs[0];
    if (!lastPulse) {
      const projectAge = daysBetween(new Date(project.created_at), now);
      if (projectAge >= 7) {
        items.push({
          kind: 'pulse_overdue',
          title: 'No weekly pulse summary yet',
          detail: `Project is ${projectAge} day${projectAge === 1 ? '' : 's'} old. Generate the first weekly summary?`,
          severity: 'low',
        });
      }
    } else {
      const lastPulseAt = new Date(lastPulse.auto_generated_at);
      const days = daysBetween(lastPulseAt, now);
      if (days >= 9) {
        items.push({
          kind: 'pulse_overdue',
          title: 'Weekly pulse overdue',
          detail: `Last pulse summary was ${days} days ago. Time to refresh.`,
          severity: days >= 14 ? 'medium' : 'low',
        });
      }
    }

    // 4. No recent activity
    const updatedAt = new Date(project.updated_at);
    const idleDays = daysBetween(updatedAt, now);
    if (idleDays >= 21) {
      items.push({
        kind: 'no_recent_activity',
        title: `Quiet for ${idleDays} days`,
        detail: 'No project activity in 3+ weeks. Are you still working on this, or should we archive it?',
        severity: idleDays >= 60 ? 'high' : idleDays >= 35 ? 'medium' : 'low',
      });
    }

    // Sort by severity (high → low), then by days overdue desc
    const severityRank: Record<InboxItem['severity'], number> = { high: 3, medium: 2, low: 1 };
    return items.sort((a, b) => {
      const s = severityRank[b.severity] - severityRank[a.severity];
      if (s !== 0) return s;
      return (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0);
    });
  }, [project, decisions, pulseLogs]);
}
