import React from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { Decision, NewDecision } from '../lib/types';

interface UseDecisionsArgs {
  projectId: string | null;
}

interface UseDecisionsReturn {
  decisions: Decision[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  log: (input: NewDecision & { user_id: string }) => Promise<Decision | null>;
  markRevisited: (id: string, outcome: string) => Promise<Decision | null>;
  reverse: (originalId: string, replacement: NewDecision & { user_id: string }) => Promise<Decision | null>;
  byId: (id: string | null) => Decision | null;
}

/**
 * Decisions CRUD scoped to a project. Captures Bezos Type-1/Type-2
 * reversibility, pre-mortem, dependency graph, revisit timer, and
 * full reversal trail.
 */
export function useDecisions({ projectId }: UseDecisionsArgs): UseDecisionsReturn {
  const [decisions, setDecisions] = React.useState<Decision[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async (): Promise<void> => {
    if (!projectId) {
      setDecisions([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('decisions')
      .select('*')
      .eq('project_id', projectId)
      .order('decided_at', { ascending: false });
    if (fetchError) {
      logger.error('Decisions fetch failed', { projectId, error: fetchError.message });
      setError(fetchError.message);
      setLoading(false);
      return;
    }
    setDecisions((data ?? []) as Decision[]);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const log = React.useCallback(async (
    input: NewDecision & { user_id: string }
  ): Promise<Decision | null> => {
    const row = {
      project_id: input.project_id,
      user_id: input.user_id,
      category: input.category,
      question: input.question.trim(),
      decision: input.decision.trim(),
      rationale: input.rationale ?? null,
      confidence: input.confidence ?? 'medium',
      reversibility: input.reversibility,
      reversibility_decay_at: input.reversibility_decay_at ?? null,
      pre_mortem: input.pre_mortem ?? null,
      depends_on_decision_id: input.depends_on_decision_id ?? null,
      tags: input.tags ?? [],
      revisit_at: input.revisit_at ?? null,
    };
    const { data, error: insertError } = await supabase
      .from('decisions')
      .insert(row)
      .select('*')
      .single();
    if (insertError || !data) {
      logger.error('Decision log failed', { error: insertError?.message });
      setError(insertError?.message ?? 'Decision log failed');
      return null;
    }
    const decision = data as Decision;
    setDecisions(prev => [decision, ...prev]);
    return decision;
  }, []);

  const markRevisited = React.useCallback(async (
    id: string,
    outcome: string
  ): Promise<Decision | null> => {
    const { data, error: updateError } = await supabase
      .from('decisions')
      .update({ outcome_observed: outcome })
      .eq('id', id)
      .select('*')
      .single();
    if (updateError || !data) {
      logger.error('Decision revisit failed', { id, error: updateError?.message });
      setError(updateError?.message ?? 'Decision revisit failed');
      return null;
    }
    const decision = data as Decision;
    setDecisions(prev => prev.map(d => d.id === id ? decision : d));
    return decision;
  }, []);

  const reverse = React.useCallback(async (
    originalId: string,
    replacement: NewDecision & { user_id: string }
  ): Promise<Decision | null> => {
    // 1. Insert the replacement decision (records what we now think instead)
    const newDec = await log(replacement);
    if (!newDec) return null;

    // 2. Mark original as reversed, pointing at the replacement
    const { data, error: updateError } = await supabase
      .from('decisions')
      .update({
        reversed_at: new Date().toISOString(),
        reversed_by_decision_id: newDec.id,
      })
      .eq('id', originalId)
      .select('*')
      .single();
    if (updateError || !data) {
      logger.error('Decision reverse failed', { originalId, error: updateError?.message });
      setError(updateError?.message ?? 'Decision reverse failed');
      return null;
    }
    const reversedOriginal = data as Decision;
    setDecisions(prev => prev.map(d => d.id === originalId ? reversedOriginal : d));
    return newDec;
  }, [log]);

  const byId = React.useCallback((id: string | null): Decision | null => {
    if (!id) return null;
    return decisions.find(d => d.id === id) ?? null;
  }, [decisions]);

  return { decisions, loading, error, refresh, log, markRevisited, reverse, byId };
}
