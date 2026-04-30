import React from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { ProjectArtifact, NewProjectArtifact } from '../lib/types';

interface UseArtifactsArgs {
  projectId: string | null;
}

interface UseArtifactsReturn {
  artifacts: ProjectArtifact[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (input: NewProjectArtifact) => Promise<ProjectArtifact | null>;
  saveNewVersion: (parentId: string, patch: Partial<NewProjectArtifact>) => Promise<ProjectArtifact | null>;
  remove: (id: string) => Promise<boolean>;
  byId: (id: string | null) => ProjectArtifact | null;
}

/**
 * Project artifact catalog. Tracks parent_artifact_id lineage so v3 of
 * a deck can reach back through v2/v1.
 */
export function useArtifacts({ projectId }: UseArtifactsArgs): UseArtifactsReturn {
  const [artifacts, setArtifacts] = React.useState<ProjectArtifact[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async (): Promise<void> => {
    if (!projectId) {
      setArtifacts([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('project_artifacts')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });
    if (fetchError) {
      logger.error('Artifacts fetch failed', { projectId, error: fetchError.message });
      setError(fetchError.message);
      setLoading(false);
      return;
    }
    setArtifacts((data ?? []) as ProjectArtifact[]);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const save = React.useCallback(async (input: NewProjectArtifact): Promise<ProjectArtifact | null> => {
    const row = {
      project_id: input.project_id,
      kind: input.kind,
      title: input.title.trim(),
      content: input.content,
      version: input.version ?? 1,
      parent_artifact_id: input.parent_artifact_id ?? null,
      exported_format: input.exported_format ?? null,
      notes: input.notes ?? null,
    };
    const { data, error: insertError } = await supabase
      .from('project_artifacts')
      .insert(row)
      .select('*')
      .single();
    if (insertError || !data) {
      logger.error('Artifact save failed', { error: insertError?.message });
      setError(insertError?.message ?? 'Artifact save failed');
      return null;
    }
    const artifact = data as ProjectArtifact;
    setArtifacts(prev => [artifact, ...prev]);
    return artifact;
  }, []);

  const saveNewVersion = React.useCallback(async (
    parentId: string,
    patch: Partial<NewProjectArtifact>
  ): Promise<ProjectArtifact | null> => {
    const parent = artifacts.find(a => a.id === parentId);
    if (!parent) {
      setError('Parent artifact not found');
      return null;
    }
    return save({
      project_id: parent.project_id,
      kind: patch.kind ?? parent.kind,
      title: patch.title ?? parent.title,
      content: patch.content ?? parent.content,
      version: parent.version + 1,
      parent_artifact_id: parent.id,
      exported_format: patch.exported_format ?? parent.exported_format ?? undefined,
      notes: patch.notes ?? undefined,
    });
  }, [artifacts, save]);

  const remove = React.useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('project_artifacts')
      .delete()
      .eq('id', id);
    if (deleteError) {
      logger.error('Artifact delete failed', { id, error: deleteError.message });
      setError(deleteError.message);
      return false;
    }
    setArtifacts(prev => prev.filter(a => a.id !== id));
    return true;
  }, []);

  const byId = React.useCallback((id: string | null): ProjectArtifact | null => {
    if (!id) return null;
    return artifacts.find(a => a.id === id) ?? null;
  }, [artifacts]);

  return { artifacts, loading, error, refresh, save, saveNewVersion, remove, byId };
}
