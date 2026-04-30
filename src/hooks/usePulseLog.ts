import React from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { ProjectPulseLog } from '../lib/types';

interface UsePulseLogArgs {
  projectId: string | null;
}

interface UsePulseLogReturn {
  pulseLogs: ProjectPulseLog[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetches the project's weekly pulse log entries, newest first.
 * Pulse generation happens server-side (cron) — this hook is read-only.
 */
export function usePulseLog({ projectId }: UsePulseLogArgs): UsePulseLogReturn {
  const [pulseLogs, setPulseLogs] = React.useState<ProjectPulseLog[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async (): Promise<void> => {
    if (!projectId) {
      setPulseLogs([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('project_pulse_log')
      .select('*')
      .eq('project_id', projectId)
      .order('week_starting', { ascending: false });
    if (fetchError) {
      logger.error('Pulse log fetch failed', { projectId, error: fetchError.message });
      setError(fetchError.message);
      setLoading(false);
      return;
    }
    setPulseLogs((data ?? []) as ProjectPulseLog[]);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  return { pulseLogs, loading, error, refresh };
}
