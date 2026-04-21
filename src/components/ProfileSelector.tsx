import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Mail, User, Upload, ArrowRight } from 'lucide-react';
import { useAppStore, UserProfile } from '../store';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export default function ProfileSelector({ onSelect }: { onSelect: () => void }) {
  const { profiles, addProfile, setCurrentUser } = useAppStore();

  const [isCreating, setIsCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newAvatar, setNewAvatar] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleSelect = (profile: UserProfile) => {
    setCurrentUser(profile);
    onSelect();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setLoading(true);

    const newProfile: UserProfile = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      email: newEmail.trim(),
      avatar: newAvatar,
    };

    // Persist to Supabase immediately so other parts of app can read it
    await supabase.from('users').upsert({
      id: newProfile.id,
      name: newProfile.name,
      email: newProfile.email,
      avatar: newProfile.avatar,
    });

    addProfile(newProfile);
    setCurrentUser(newProfile);

    setTimeout(() => {
      setLoading(false);
      onSelect();
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-[#0c0c0c] flex flex-col items-center justify-center p-8 dark selection:bg-primary/20">

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 space-y-2"
      >
        <h1 className="text-5xl font-black text-foreground tracking-tight">
          Cock<span className="text-primary">Roach</span>
        </h1>
        <p className="text-muted-foreground text-[14px] font-medium italic max-w-sm text-center">
          The startups that survive aren't unicorns, they're cockroaches. Resilient! Ugly! Unstoppable!
        </p>
      </motion.div>

      {/* Profile Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap items-center justify-center gap-8"
      >
        {profiles.map((profile, i) => (
          <motion.button
            key={profile.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => handleSelect(profile)}
            onMouseEnter={() => setHoveredId(profile.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="flex flex-col items-center gap-3 group"
          >
            <div className={cn(
              "w-[130px] h-[130px] rounded-[22px] overflow-hidden border-2 transition-all duration-200 relative",
              hoveredId === profile.id
                ? "border-primary scale-105 shadow-[0_0_30px_rgba(var(--primary),0.25)]"
                : "border-white/10 scale-100"
            )}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary-bg flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Hover overlay */}
              <div className={cn(
                "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200",
                hoveredId === profile.id ? "opacity-100" : "opacity-0"
              )}>
                <ArrowRight size={28} className="text-white" />
              </div>
            </div>
            <span className={cn(
              "text-[15px] font-semibold tracking-wide transition-colors",
              hoveredId === profile.id ? "text-primary" : "text-foreground"
            )}>
              {profile.name}
            </span>
          </motion.button>
        ))}

        {/* Add Profile Card */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: profiles.length * 0.08 }}
          onClick={() => setIsCreating(true)}
          onMouseEnter={() => setHoveredId('__add')}
          onMouseLeave={() => setHoveredId(null)}
          className="flex flex-col items-center gap-3 group"
        >
          <div className={cn(
            "w-[130px] h-[130px] rounded-[22px] border-2 border-dashed flex items-center justify-center transition-all duration-200",
            hoveredId === '__add'
              ? "border-primary/60 bg-primary/5 scale-105"
              : "border-white/10 bg-white/[0.02] scale-100"
          )}>
            <Plus size={32} className={cn(
              "transition-colors duration-200",
              hoveredId === '__add' ? "text-primary" : "text-muted-foreground/40"
            )} />
          </div>
          <span className={cn(
            "text-[15px] font-semibold tracking-wide transition-colors",
            hoveredId === '__add' ? "text-primary" : "text-muted-foreground/60"
          )}>
            Add Profile
          </span>
        </motion.button>
      </motion.div>

      {/* Bottom hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-14 text-[13px] text-muted-foreground/50 font-medium"
      >
        Select your profile to continue
      </motion.p>

      {/* Create Profile Modal */}
      <AnimatePresence>
        {isCreating && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setIsCreating(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed z-50 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Create Profile</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Each profile has its own workspace — no data shared.</p>
                </div>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Avatar upload */}
              <div className="flex justify-center mb-6">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative group"
                >
                  <div className="w-24 h-24 rounded-[18px] border-2 border-dashed border-white/15 overflow-hidden bg-white/[0.03] flex items-center justify-center transition-all group-hover:border-primary/50">
                    {newAvatar ? (
                      <img src={newAvatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} className="text-muted-foreground/40" />
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload size={18} className="text-white" />
                    </div>
                  </div>
                  <span className="block text-[11px] text-muted-foreground mt-1.5 text-center">Add photo</span>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</label>
                  <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      required
                      autoFocus
                      type="text"
                      placeholder="Your name"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-3 pl-9 pr-4 text-[14px] text-foreground focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      required
                      type="email"
                      placeholder="you@example.com"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-3 pl-9 pr-4 text-[14px] text-foreground focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-3 text-[12px] font-bold text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 rounded-xl transition-all uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newName.trim() || !newEmail.trim()}
                    className="flex-[2] py-3 bg-primary hover:brightness-110 text-white text-[12px] font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-40 uppercase tracking-widest active:scale-[0.98]"
                  >
                    {loading ? 'Creating...' : 'Create Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
