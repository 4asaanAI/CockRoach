import type { Project, Decision } from './types';

const REVERSIBILITY_LABELS = {
  reversible: 'reversible',
  expensive:  'expensive (costly to undo)',
  one_way:    'one-way (irreversible)',
} as const;

const STAGE_HINTS: Record<Project['stage'], string> = {
  idea:      'pre-validation; brainstorming what to build',
  validated: 'idea passed scoring; not yet building',
  building:  'MVP in progress; pre-launch',
  launched:  'live with users; iterating toward PMF',
  scaling:   'PMF clear; growing revenue/team',
  paused:    'active work suspended; not abandoned',
  archived:  'done, killed, or pivoted away',
};

/**
 * Format a project's state into a markdown block suitable for system-prompt
 * injection. Includes the latest 10 non-reversed decisions so the agent
 * remembers what the founder has already committed to.
 *
 * Returns null when there is no active project.
 */
export function formatProjectContext(
  project: Project | null,
  decisions: Decision[],
): string | null {
  if (!project) return null;

  const lines: string[] = [];
  lines.push(`Active project: **${project.name}** (stage: ${project.stage} — ${STAGE_HINTS[project.stage]})`);
  if (project.description) lines.push(`Description: ${project.description}`);

  const recent = decisions
    .filter(d => !d.reversed_at)
    .sort((a, b) => new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime())
    .slice(0, 10);

  if (recent.length > 0) {
    lines.push('');
    lines.push('Recent strategic decisions (newest first):');
    recent.forEach(d => {
      const tag = `[${d.category}, ${REVERSIBILITY_LABELS[d.reversibility]}, ${d.confidence}-confidence]`;
      lines.push(`- ${tag} ${d.question} → ${d.decision}`);
      if (d.pre_mortem) lines.push(`  pre-mortem: ${d.pre_mortem}`);
    });
    lines.push('');
    lines.push(
      'Treat these decisions as load-bearing context. Reference them when relevant. ' +
      'If the user is about to contradict a recent one-way-door decision, flag the conflict before answering.',
    );
  }

  return lines.join('\n');
}
