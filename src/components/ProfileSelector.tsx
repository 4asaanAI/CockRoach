import React from 'react';
import { useAppStore, UserProfile } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { User, Plus, Mail, Lock, LogIn, Bot, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ProfileSelector({ onSelect }: { onSelect: () => void }) {
  const { profiles, addProfile, setCurrentUser } = useAppStore();
  const [isCreating, setIsCreating] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: '', email: '', password: '' });

  const handleSelect = (profile: UserProfile) => {
    setCurrentUser(profile);
    onSelect();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const newProfile: UserProfile = {
      id: Math.random().toString(36).substring(7),
      name: formData.name,
      email: formData.email,
    };
    
    addProfile(newProfile);
    setCurrentUser(newProfile);
    onSelect();
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-6 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-10">
        {/* Brand Lockup */}
        <div className="text-center space-y-6">
          <div className="inline-block relative group">
             <div className="w-16 h-16 bg-primary-bg border border-primary-border rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:rotate-3 shadow-sm">
                <Bot size={34} className="text-primary" strokeWidth={1.5} />
             </div>
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-foreground tracking-tighter uppercase">CockRoach</h1>
            <p className="text-muted-foreground text-sm font-medium tracking-tight uppercase">Industrial AI Strategy</p>
          </div>
        </div>

        <div className="layaa-card bg-card/50 backdrop-blur-md shadow-2xl p-8 relative overflow-hidden ring-1 ring-primary/5">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent" />
          
          <AnimatePresence mode="wait">
            {!isCreating ? (
              <motion.div 
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-foreground">Strategic Link</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Neural Handshake Required</p>
                </div>

                <div className="space-y-3">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleSelect(profile)}
                      className="w-full layaa-card layaa-card-interactive p-4 flex items-center justify-between group bg-background"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-bg border border-primary-border flex items-center justify-center text-primary font-bold group-hover:scale-105 transition-transform overflow-hidden">
                          {profile.avatar ? (
                            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                          ) : (
                            profile.name[0].toUpperCase()
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{profile.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">USA Strategic</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>

                <div className="pt-6 border-t border-border flex flex-col gap-4">
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    <Plus size={16} />
                    <span>Establish New Identity</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-foreground">Digital Handshake</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Forge Macro Identity</p>
                </div>

                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Identity Tag</label>
                    <div className="relative group">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Stakeholder Beta"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all shadow-inner font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pb-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Strategic Protocol</label>
                    <div className="relative group">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input 
                        required
                        type="password" 
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all shadow-inner font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="flex-1 px-4 py-3 bg-surface-mid text-muted-foreground text-xs font-bold rounded-xl hover:text-foreground hover:bg-border transition-all uppercase tracking-widest"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] px-4 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest active:scale-[0.98]"
                    >
                      <LogIn size={16} />
                      <span>Sync Account</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em]">
          CockRoach Industrial Intelligence &copy; 2026 · Confidential Workspace
        </p>
      </div>
    </div>
  );
}
