import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface ProjectChatSummary {
  id: string;
  title: string | null;
  updated_at: string;
}

interface Props {
  projectId: string;
  onOpenChat: (chatId: string) => void;
}

export default function ChatsTab({ projectId, onOpenChat }: Props) {
  const [chats, setChats] = React.useState<ProjectChatSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('chats')
      .select('id, title, updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          logger.error('Project chats fetch failed', { projectId, error: error.message });
        }
        setChats((data ?? []) as ProjectChatSummary[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-14 rounded-xl bg-surface-mid/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="layaa-card bg-card/30 border-border p-8 text-center space-y-2">
        <MessageSquare size={28} className="text-muted-foreground/40 mx-auto" />
        <p className="text-[13px] text-foreground font-medium">No chats linked to this project yet</p>
        <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
          Open a chat from the sidebar and use the "Anchor to project" action to attach it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chats.map((c, i) => (
        <motion.button
          key={c.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.02 }}
          onClick={() => onOpenChat(c.id)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-card/40 border border-border/40 rounded-xl text-left hover:border-primary/30 hover:bg-card/60 transition-all group"
        >
          <MessageSquare size={14} className="text-muted-foreground/60 group-hover:text-primary transition-all shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-foreground font-medium truncate">
              {c.title || 'Untitled chat'}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              {new Date(c.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          <ArrowRight size={12} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </motion.button>
      ))}
    </div>
  );
}
