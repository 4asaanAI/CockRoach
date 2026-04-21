import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogIn, Plus, Bot, Command, ArrowRight, ShieldAlert, Mail } from 'lucide-react';
import { useAppStore, UserProfile } from '../store';
import { cn } from '../lib/utils';

export default function ProfileSelector({ onSelect }: { onSelect: () => void }) {
  const { profiles, addProfile, setCurrentUser } = useAppStore();
  
  const [isCreating, setIsCreating] = React.useState(false);
  const [newProfileName, setNewProfileName] = React.useState('');
  const [newProfileEmail, setNewProfileEmail] = React.useState('');
  
  const [loading, setLoading] = React.useState(false);

  const handleSelect = (profile: UserProfile) => {
    setCurrentUser(profile);
    onSelect();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !newProfileEmail.trim()) return;
    
    setLoading(true);

    const newProfile: UserProfile = {
      id: crypto.randomUUID(),
      name: newProfileName.trim(),
      email: newProfileEmail.trim(),
      avatar: ''
    };
    
    addProfile(newProfile);
    setCurrentUser(newProfile);
    
    // Simulate slight initialization frame
    setTimeout(() => {
      setLoading(false);
      onSelect();
    }, 400);
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-8"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-foreground">Select Identity</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Neural Handshake Required</p>
                </div>

                <div className="space-y-3">
                  {profiles.map(profile => (
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
                            profile.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{profile.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                            {profile.isInitial ? 'Root Access' : 'Standard User'}
                          </p>
                        </div>
                      </div>
                      <LogIn size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-primary transition-all" />
                    </button>
                  ))}

                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full layaa-card layaa-card-interactive p-4 flex items-center justify-center gap-2 group bg-background border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all mt-4"
                  >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Establish New Identity</span>
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
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Identity Tag (Name)</label>
                    <div className="relative group">
                      <Command size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input 
                        required
                        type="text" 
                        placeholder="Operative Designation"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pb-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Link</label>
                    <div className="relative group">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input 
                        required
                        type="email" 
                        placeholder="agent@cockroach.ai"
                        value={newProfileEmail}
                        onChange={(e) => setNewProfileEmail(e.target.value)}
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
                      disabled={loading}
                      className="flex-[2] px-4 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest active:scale-[0.98]"
                    >
                      {loading ? 'Processing...' : <><Plus size={16} /> <span>Initialize</span></>}
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
