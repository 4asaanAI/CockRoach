import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FolderKanban } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { PROJECT_STAGES } from '../../lib/types';
import type { NewProject, ProjectStage } from '../../lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: NewProject) => Promise<unknown>;
}

export default function CreateProjectModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [stage, setStage] = React.useState<ProjectStage>('idea');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setStage('idea');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name required');
      return;
    }
    setSubmitting(true);
    const result = await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      stage,
    });
    setSubmitting(false);
    if (result) {
      toast.success(`Project "${name.trim()}" created`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl"
            role="dialog"
            aria-label="Create project"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FolderKanban size={16} className="text-primary" />
                <h2 className="text-sm font-bold text-foreground tracking-wide">Start a new project</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-all"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Project name</label>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cockroach SaaS launch"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">One-line description (optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you building, for whom?"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Stage</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PROJECT_STAGES.filter(s => s.id !== 'archived').map(s => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setStage(s.id)}
                      className={cn(
                        'px-3 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg border transition-all text-left',
                        stage === s.id
                          ? 'bg-primary/15 text-primary border-primary/30'
                          : 'bg-surface-mid text-muted-foreground border-border hover:border-primary/30'
                      )}
                      title={s.description}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/70 italic px-1">
                  {PROJECT_STAGES.find(s => s.id === stage)?.description}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest bg-primary text-background rounded-lg disabled:opacity-50 hover:brightness-110 transition-all"
                >
                  {submitting ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
