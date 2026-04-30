import { motion } from 'motion/react';
import { FileText, Download } from 'lucide-react';
import { useArtifacts } from '../../hooks/useArtifacts';
import { ARTIFACT_KINDS } from '../../lib/types';
import type { ProjectArtifact, ArtifactKind } from '../../lib/types';
import { cn } from '../../lib/utils';

interface Props {
  projectId: string;
}

const KIND_ACCENT: Partial<Record<ArtifactKind, string>> = {
  pitch_deck: 'text-amber-300 bg-amber-950/40 border-amber-500/25',
  financial_model: 'text-emerald-300 bg-emerald-950/40 border-emerald-500/25',
  positioning_doc: 'text-violet-300 bg-violet-950/40 border-violet-500/25',
  business_plan: 'text-blue-300 bg-blue-950/40 border-blue-500/25',
  gtm_plan: 'text-pink-300 bg-pink-950/40 border-pink-500/25',
  investor_update: 'text-primary bg-primary-bg border-primary/25',
  legal_doc: 'text-muted-foreground bg-surface-mid border-border',
  idea_validation: 'text-cyan-300 bg-cyan-950/40 border-cyan-500/25',
};

const DEFAULT_ACCENT = 'text-muted-foreground bg-surface-mid border-border';

export default function ArtifactsTab({ projectId }: Props) {
  const { artifacts, loading } = useArtifacts({ projectId });

  if (loading && artifacts.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-32 rounded-xl bg-surface-mid/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="layaa-card bg-card/30 border-border p-8 text-center space-y-2">
        <FileText size={28} className="text-muted-foreground/40 mx-auto" />
        <p className="text-[13px] text-foreground font-medium">No artifacts yet</p>
        <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
          Every export you save under this project — pitch decks, models, memos — lands here with version history.
        </p>
      </div>
    );
  }

  // Group by parent_artifact_id null (versioning roots) — show roots first;
  // inline-show their version chain.
  const roots = artifacts.filter(a => a.parent_artifact_id === null);
  const childrenByRoot = new Map<string, ProjectArtifact[]>();
  artifacts.forEach(a => {
    if (a.parent_artifact_id) {
      const list = childrenByRoot.get(a.parent_artifact_id) ?? [];
      list.push(a);
      childrenByRoot.set(a.parent_artifact_id, list);
    }
  });

  // For each root, find its full chain by following children
  function chainFor(root: ProjectArtifact): ProjectArtifact[] {
    const chain = [root];
    let current = root;
    while (true) {
      const children = childrenByRoot.get(current.id) ?? [];
      if (children.length === 0) break;
      // Take the highest-version child; they should be on a single chain
      const next = children.sort((a, b) => b.version - a.version)[0];
      chain.push(next);
      current = next;
    }
    return chain;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {roots.map((root, i) => {
        const chain = chainFor(root);
        const latest = chain[chain.length - 1];
        const accent = KIND_ACCENT[latest.kind] ?? DEFAULT_ACCENT;
        const kindLabel = ARTIFACT_KINDS.find(k => k.id === latest.kind)?.label ?? latest.kind;
        return (
          <motion.div
            key={root.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="layaa-card layaa-card-interactive bg-card/50 backdrop-blur-sm p-4 flex flex-col group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border', accent)}>
                {kindLabel}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/60">v{latest.version}</span>
            </div>
            <h3 className="text-[14px] font-bold text-foreground line-clamp-2 mb-1">{latest.title}</h3>
            {latest.notes && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{latest.notes}</p>
            )}
            <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/40">
              <span className="text-[10px] text-muted-foreground/60">
                {chain.length > 1 ? `${chain.length} versions` : '1 version'}
              </span>
              {latest.exported_format && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  <Download size={10} />
                  {latest.exported_format}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
