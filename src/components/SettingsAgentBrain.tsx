import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { COCKROACH_DEFAULT_SYSTEM_PROMPT, KB_01, KB_02, KB_03, KB_04 } from '../lib/kb-constants';
import { buildSystemPrompt } from '../lib/system-prompt-builder';
import {
  Save,
  RefreshCcw,
  Brain,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';

const KB_META = [
  { key: 'kb01' as const, label: 'KB-01: Identity & Personality', desc: 'Voice, tone, personality rules, and what Cockroach never does.' },
  { key: 'kb02' as const, label: 'KB-02: Idea Analysis Framework', desc: '10-section report structure and scoring logic.' },
  { key: 'kb03' as const, label: 'KB-03: USA Funding & Grants', desc: 'SBA, SBIR, certifications, accelerators, and crowdfunding.' },
  { key: 'kb04' as const, label: 'KB-04: Output Formats & Structure', desc: 'Response format rules for every mode and output type.' },
];

export default function SettingsAgentBrain() {
  const { currentUser, kbToggles, setKBToggles, memoryItems, setMemoryItems, systemPrompt, setSystemPrompt } = useAppStore();

  const [localPrompt, setLocalPrompt] = React.useState(systemPrompt || COCKROACH_DEFAULT_SYSTEM_PROMPT);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = React.useState(false);
  const [newMemoryContent, setNewMemoryContent] = React.useState('');
  const [newMemoryCategory, setNewMemoryCategory] = React.useState('general');
  const [isAddingMemory, setIsAddingMemory] = React.useState(false);
  const [showAddMemory, setShowAddMemory] = React.useState(false);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      loadSystemPrompt();
      loadMemoryItems();
    }
  }, [currentUser?.id]);

  const loadSystemPrompt = async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      toast.error(`Failed to load system prompt: ${error.message}`);
      return;
    }

    if (data) {
      setLocalPrompt(data.prompt);
      setSystemPrompt(data.prompt);
      setKBToggles({
        kb01: data.kb_01_enabled ?? true,
        kb02: data.kb_02_enabled ?? true,
        kb03: data.kb_03_enabled ?? true,
        kb04: data.kb_04_enabled ?? true,
      });
    } else {
      // Seed default
      await seedDefaultSystemPrompt();
    }
  };

  const seedDefaultSystemPrompt = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('system_prompts').insert({
      user_id: currentUser.id,
      prompt: COCKROACH_DEFAULT_SYSTEM_PROMPT,
      kb_01_enabled: true,
      kb_02_enabled: true,
      kb_03_enabled: true,
      kb_04_enabled: true,
    });
    if (error) {
      toast.error(`Failed to seed system prompt: ${error.message}`);
    } else {
      setLocalPrompt(COCKROACH_DEFAULT_SYSTEM_PROMPT);
      setSystemPrompt(COCKROACH_DEFAULT_SYSTEM_PROMPT);
    }
  };

  const loadMemoryItems = async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('memory_items')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Failed to load memory: ${error.message}`);
      return;
    }
    if (data) setMemoryItems(data);
  };

  const handleSavePrompt = async () => {
    if (!currentUser) return;
    setIsSavingPrompt(true);
    try {
      const { error } = await supabase
        .from('system_prompts')
        .upsert({
          user_id: currentUser.id,
          prompt: localPrompt,
          kb_01_enabled: kbToggles.kb01,
          kb_02_enabled: kbToggles.kb02,
          kb_03_enabled: kbToggles.kb03,
          kb_04_enabled: kbToggles.kb04,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setSystemPrompt(localPrompt);
      toast.success('Agent brain configuration saved.');
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleResetToDefault = () => {
    setLocalPrompt(COCKROACH_DEFAULT_SYSTEM_PROMPT);
    toast.success('System prompt reset to default. Click Save to persist.');
  };

  const handleToggleKB = async (key: 'kb01' | 'kb02' | 'kb03' | 'kb04') => {
    const newToggles = { ...kbToggles, [key]: !kbToggles[key] };
    setKBToggles({ [key]: !kbToggles[key] });

    if (!currentUser) return;
    await supabase.from('system_prompts').upsert({
      user_id: currentUser.id,
      prompt: localPrompt,
      kb_01_enabled: newToggles.kb01,
      kb_02_enabled: newToggles.kb02,
      kb_03_enabled: newToggles.kb03,
      kb_04_enabled: newToggles.kb04,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  };

  const handleAddMemory = async () => {
    if (!currentUser || !newMemoryContent.trim()) return;
    setIsAddingMemory(true);
    try {
      const { data, error } = await supabase.from('memory_items').insert({
        user_id: currentUser.id,
        content: newMemoryContent.trim(),
        category: newMemoryCategory.trim() || 'general',
      }).select().single();

      if (error) throw error;
      if (data) setMemoryItems([data, ...memoryItems]);
      setNewMemoryContent('');
      setNewMemoryCategory('general');
      setShowAddMemory(false);
      toast.success('Memory item added.');
    } catch (err: any) {
      toast.error(`Failed to add memory: ${err.message}`);
    } finally {
      setIsAddingMemory(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('memory_items').delete().eq('id', id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
      return;
    }
    setMemoryItems(memoryItems.filter(m => m.id !== id));
    toast.success('Memory item removed.');
  };

  const handleClearAllMemory = async () => {
    if (!currentUser || memoryItems.length === 0) return;
    const { error } = await supabase.from('memory_items').delete().eq('user_id', currentUser.id);
    if (error) {
      toast.error(`Failed to clear memory: ${error.message}`);
      return;
    }
    setMemoryItems([]);
    toast.success('Memory cleared.');
  };

  const assembledPreview = buildSystemPrompt({
    systemPromptBase: localPrompt,
    kbToggles,
    memoryItems,
    activeMode: 'IDEA_GENERATION',
    userName: currentUser?.name || 'User',
    isBrutalHonesty: false,
  });

  const KB_CONTENT: Record<string, string> = { kb01: KB_01, kb02: KB_02, kb03: KB_03, kb04: KB_04 };
  const enabledKBsSize = KB_META
    .filter(kb => kbToggles[kb.key])
    .reduce((acc, kb) => acc + KB_CONTENT[kb.key].length, 0);
  const promptTokenEstimate = Math.round(assembledPreview.length / 4);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* System Prompt */}
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">System Prompt</h2>
          <p className="text-muted-foreground text-[13px] leading-relaxed max-w-2xl">
            The core instructions that define Cockroach's behavior. This is injected at the start of every conversation.
          </p>
        </div>

        <div className="layaa-card bg-card/50 backdrop-blur-sm shadow-xl ring-1 ring-primary/5 p-6 space-y-4">
          <textarea
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            className="w-full h-80 bg-background border border-border rounded-xl p-4 text-[13px] text-foreground font-mono focus:outline-none focus:border-primary/50 transition-all resize-none layaa-scroll leading-relaxed"
            placeholder="Enter system prompt..."
          />
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono">
                {localPrompt.length.toLocaleString()} chars
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 rounded-lg transition-all uppercase tracking-widest"
              >
                <RefreshCcw size={12} />
                <span>Reset to Default</span>
              </button>
              <button
                onClick={handleSavePrompt}
                disabled={isSavingPrompt}
                className="flex items-center gap-2 px-6 py-2 bg-primary hover:brightness-110 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-primary/20 uppercase tracking-widest disabled:opacity-50 active:scale-95"
              >
                <Save size={12} />
                <span>{isSavingPrompt ? 'Saving...' : 'Save Prompt'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KB Toggles */}
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Knowledge Bases</h2>
          <p className="text-muted-foreground text-[13px] leading-relaxed max-w-2xl">
            Toggle which knowledge bases are injected into every conversation. Disabling KBs reduces token usage but limits Cockroach's capability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {KB_META.map((kb) => (
            <button
              key={kb.key}
              onClick={() => handleToggleKB(kb.key)}
              className={cn(
                'layaa-card p-5 flex items-start gap-4 text-left transition-all',
                kbToggles[kb.key]
                  ? 'border-primary/40 bg-primary-bg ring-1 ring-primary/10'
                  : 'border-border hover:border-border/70 opacity-60'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                kbToggles[kb.key] ? 'bg-primary border-primary' : 'border-border bg-background'
              )}>
                {kbToggles[kb.key] && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[12px] font-bold text-foreground">{kb.label}</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{kb.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-background border border-border rounded-xl px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            KBs enabled: {KB_META.filter(kb => kbToggles[kb.key]).length}/4 · KB content: ~{Math.round(enabledKBsSize / 4).toLocaleString()} tokens
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            Full system prompt estimate: ~{promptTokenEstimate.toLocaleString()} tokens/request
          </span>
        </div>
      </div>

      {/* Memory */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Strategic Memory</h2>
            <p className="text-muted-foreground text-[13px] leading-relaxed max-w-2xl">
              Memory items are injected at the start of every conversation. Cockroach uses them silently — it won't tell the user it's reading memory.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {memoryItems.length > 0 && (
              showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Clear all {memoryItems.length} items?</span>
                  <button
                    onClick={() => { handleClearAllMemory(); setShowClearConfirm(false); }}
                    className="px-3 py-1.5 text-[10px] font-bold text-white bg-destructive hover:brightness-110 rounded-lg transition-all uppercase tracking-widest"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground border border-border rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-destructive hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/40 rounded-lg transition-all uppercase tracking-widest"
                >
                  <Trash2 size={11} />
                  <span>Clear All</span>
                </button>
              )
            )}
            <button
              onClick={() => setShowAddMemory(!showAddMemory)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-primary hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-lg transition-all uppercase tracking-widest"
            >
              <Plus size={11} />
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        {showAddMemory && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="layaa-card p-5 space-y-4 border-primary/30 bg-primary-bg/30"
          >
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Category</label>
                <input
                  type="text"
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value)}
                  placeholder="general"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="col-span-3 space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Memory Content</label>
                <input
                  type="text"
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  placeholder="e.g. User is building a B2B SaaS for logistics companies in the USA"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddMemory(false)}
                className="px-4 py-2 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMemory}
                disabled={isAddingMemory || !newMemoryContent.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:brightness-110 text-white text-[11px] font-bold rounded-lg transition-all uppercase tracking-widest disabled:opacity-50"
              >
                <Save size={11} />
                <span>{isAddingMemory ? 'Saving...' : 'Save Memory'}</span>
              </button>
            </div>
          </motion.div>
        )}

        <div className="layaa-card bg-card/50 backdrop-blur-sm shadow-xl ring-1 ring-primary/5 overflow-hidden">
          {memoryItems.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
              <Brain size={32} className="text-muted-foreground/30" />
              <p className="text-[13px] text-muted-foreground font-medium">No memory yet. Your graveyard is empty. For now.</p>
              <p className="text-[11px] text-muted-foreground/60 max-w-xs leading-relaxed">
                Add memory items to give Cockroach persistent context about your preferences, active projects, and established decisions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {memoryItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-card/40 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest block mb-0.5">{item.category}</span>
                    <p className="text-[13px] text-foreground leading-relaxed">{item.content}</p>
                    <span className="text-[10px] text-muted-foreground/50 font-mono mt-0.5 block">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(item.id)}
                    className="p-1.5 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    title="Delete memory item"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-4">
        <button
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          className="w-full flex items-center justify-between px-5 py-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            {isPreviewOpen ? <EyeOff size={14} className="text-muted-foreground" /> : <Eye size={14} className="text-muted-foreground" />}
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
              What Cockroach Currently Knows
            </span>
            <span className="text-[10px] text-muted-foreground/50 font-mono">Live assembled system prompt preview</span>
          </div>
          {isPreviewOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </button>

        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="layaa-card bg-card/30 p-5"
          >
            <pre className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto layaa-scroll">
              {assembledPreview}
            </pre>
            <div className="pt-3 border-t border-border mt-3 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {assembledPreview.length.toLocaleString()} chars · ~{Math.round(assembledPreview.length / 4).toLocaleString()} tokens
              </span>
              <span className="text-[10px] text-muted-foreground/50 font-mono italic">This is injected as the system message on every API call</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
