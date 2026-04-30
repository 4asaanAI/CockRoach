import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import {
  DECISION_CATEGORIES,
  REVERSIBILITY_LEVELS,
} from '../../lib/types';
import type {
  NewDecision,
  DecisionCategory,
  Reversibility,
  Confidence,
} from '../../lib/types';

interface Props {
  open: boolean;
  projectId: string;
  userId: string;
  onClose: () => void;
  onLog: (input: NewDecision & { user_id: string }) => Promise<unknown>;
}

const CONFIDENCE_LEVELS: { id: Confidence; label: string }[] = [
  { id: 'low',    label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high',   label: 'High' },
];

const REVERSIBILITY_TONE: Record<Reversibility, string> = {
  reversible: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
  expensive:  'bg-amber-950/40 text-amber-300 border-amber-500/30',
  one_way:    'bg-destructive/15 text-destructive border-destructive/30',
};

const REVERSIBILITY_HELP: Record<Reversibility, string> = {
  reversible: 'Two-way door (Bezos type 2). Easy to undo. Decide fast.',
  expensive:  'Reversible but costly — money, reputation, or time.',
  one_way:    'One-way door (Bezos type 1). Hard or impossible to undo. Slow down.',
};

export default function DecisionFormModal({ open, projectId, userId, onClose, onLog }: Props) {
  const [category, setCategory] = React.useState<DecisionCategory>('product');
  const [question, setQuestion] = React.useState('');
  const [decision, setDecision] = React.useState('');
  const [rationale, setRationale] = React.useState('');
  const [confidence, setConfidence] = React.useState<Confidence>('medium');
  const [reversibility, setReversibility] = React.useState<Reversibility>('reversible');
  const [preMortem, setPreMortem] = React.useState('');
  const [revisitDate, setRevisitDate] = React.useState('');
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCategory('product');
      setQuestion('');
      setDecision('');
      setRationale('');
      setConfidence('medium');
      setReversibility('reversible');
      setPreMortem('');
      setRevisitDate('');
      setShowAdvanced(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !decision.trim()) {
      toast.error('Question and decision are required');
      return;
    }
    setSubmitting(true);
    const input: NewDecision & { user_id: string } = {
      project_id: projectId,
      user_id: userId,
      category,
      question: question.trim(),
      decision: decision.trim(),
      reversibility,
      confidence,
    };
    if (rationale.trim()) input.rationale = rationale.trim();
    if (preMortem.trim()) input.pre_mortem = preMortem.trim();
    if (revisitDate) input.revisit_at = new Date(revisitDate).toISOString();

    const result = await onLog(input);
    setSubmitting(false);
    if (result) {
      toast.success('Decision logged');
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
            className="w-full max-w-xl bg-card border border-border/60 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto layaa-scroll"
            role="dialog"
            aria-label="Log decision"
          >
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-border/40 bg-card z-10">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-primary" />
                <h2 className="text-sm font-bold text-foreground tracking-wide">Log a decision</h2>
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
              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Category</label>
                <div className="grid grid-cols-3 gap-1">
                  {DECISION_CATEGORIES.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        'px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all',
                        category === c.id
                          ? 'bg-primary/15 text-primary border-primary/30'
                          : 'bg-surface-mid text-muted-foreground border-border hover:border-primary/20'
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Question</label>
                <textarea
                  rows={2}
                  autoFocus
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What were you deciding? e.g. 'Per-seat or usage-based pricing for V1?'"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 resize-none"
                />
              </div>

              {/* Decision */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Decision</label>
                <textarea
                  rows={2}
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="What did you decide?"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 resize-none"
                />
              </div>

              {/* Reversibility — visual */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Reversibility (Bezos type)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {REVERSIBILITY_LEVELS.map(r => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setReversibility(r.id)}
                      className={cn(
                        'px-3 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg border transition-all',
                        reversibility === r.id
                          ? REVERSIBILITY_TONE[r.id]
                          : 'bg-surface-mid text-muted-foreground border-border hover:border-primary/20'
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/70 italic px-1">
                  {REVERSIBILITY_HELP[reversibility]}
                </p>
              </div>

              {/* Confidence */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Confidence at decision time</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CONFIDENCE_LEVELS.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setConfidence(c.id)}
                      className={cn(
                        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all',
                        confidence === c.id
                          ? 'bg-primary/15 text-primary border-primary/30'
                          : 'bg-surface-mid text-muted-foreground border-border hover:border-primary/20'
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rationale */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Rationale (optional)</label>
                <textarea
                  rows={2}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Why this over alternatives?"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 resize-none"
                />
              </div>

              {/* Advanced toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(s => !s)}
                className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-all"
              >
                {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showAdvanced ? 'Hide advanced' : 'Show advanced'} (pre-mortem, revisit timer)
              </button>

              {showAdvanced && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Pre-mortem (optional)</label>
                    <textarea
                      rows={2}
                      value={preMortem}
                      onChange={(e) => setPreMortem(e.target.value)}
                      placeholder="If this decision turns out wrong, what's the most likely failure mode?"
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Revisit on (optional)</label>
                    <input
                      type="date"
                      value={revisitDate}
                      onChange={(e) => setRevisitDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground/70 italic px-1">
                      We'll surface this in your inbox on the date — you'll capture what actually happened then.
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 sticky bottom-0 bg-card pb-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !question.trim() || !decision.trim()}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest bg-primary text-background rounded-lg disabled:opacity-50 hover:brightness-110 transition-all"
                >
                  {submitting ? 'Logging…' : 'Log decision'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
