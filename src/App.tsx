import React from 'react';
import { useAppStore } from './store';
import { cn } from './lib/utils';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  Hash, 
  FolderKanban, 
  Settings, 
  User,
  PanelLeftClose,
  PanelRightClose,
  ChevronRight,
  Pin,
  Clock,
  LogOut,
  Brain,
  Bot,
  Sun,
  Moon,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SettingsLLM from './components/SettingsLLM';
import ProfileSelector from './components/ProfileSelector';
import { Toaster } from 'sonner';

export default function App() {
  const { currentUser, profiles, azureConfig } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = React.useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<'chat' | 'settings' | 'research' | 'memory' | 'projects'>('chat');
  const [isBrutalHonesty, setIsBrutalHonesty] = React.useState(false);
  
  // Chat State
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const baseUrl = azureConfig.endpoint.endsWith('/') ? azureConfig.endpoint.slice(0, -1) : azureConfig.endpoint;
      const url = `${baseUrl}/openai/deployments/${azureConfig.deployment}/chat/completions?api-version=${azureConfig.version}`;
      
      const response = await fetch(url.replace(/([^:]\/)\/+/g, "$1"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureConfig.apiKey
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `You are CockRoach, a strategic intelligence platform. The user is ${currentUser?.name}. ${isBrutalHonesty ? 'Respond with brutal honesty, highlighting flaws directly.' : ''}` },
            ...newMessages
          ],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Azure Error: ${err.error?.message || response.statusText}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Neural connection interrupted: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isAuthenticated) {
    return <ProfileSelector onSelect={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20 selection:text-primary dark">
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Sidebar - Layaa OS Style */}
      <motion.aside 
        initial={false}
        animate={{ width: isLeftSidebarCollapsed ? 0 : 256 }}
        className={cn(
          "h-full bg-sidebar border-r border-border flex flex-col transition-all overflow-hidden relative shadow-sm z-30",
          isLeftSidebarCollapsed && "border-none"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-sidebar/50 backdrop-blur-sm sticky top-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm shadow-primary/20">
              <Bot size={20} className="text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground tracking-tight text-[15px] uppercase">CockRoach</span>
              <span className="text-[9px] text-muted-foreground font-mono bg-surface-mid border border-border px-1.5 py-0.5 rounded uppercase">v0.1</span>
            </div>
          </div>
          <button 
            onClick={() => setIsLeftSidebarCollapsed(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Action Button - New Chat */}
        <div className="p-3">
          <button className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold h-10 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-sm shadow-primary/20">
            <Plus size={16} />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-6 layaa-scroll">
          <div className="space-y-0.5">
             <button 
                onClick={() => setCurrentPage('chat')}
                className={cn("layaa-nav-item w-full", currentPage === 'chat' && "layaa-nav-item-active")}
              >
               <MessageSquare size={16} />
               <span>Brainstorming</span>
             </button>
             <button 
                onClick={() => setCurrentPage('research')}
                className={cn("layaa-nav-item w-full", currentPage === 'research' && "layaa-nav-item-active")}
              >
               <Search size={16} />
               <span>Deep Research</span>
             </button>
             <button 
                onClick={() => setCurrentPage('memory')}
                className={cn("layaa-nav-item w-full", currentPage === 'memory' && "layaa-nav-item-active")}
              >
               <Brain size={16} />
               <span>Memory</span>
             </button>
             <button 
                onClick={() => setCurrentPage('projects')}
                className={cn("layaa-nav-item w-full", currentPage === 'projects' && "layaa-nav-item-active")}
              >
               <FolderKanban size={16} />
               <span>Macro Projects</span>
             </button>
          </div>

          <div className="pt-2">
            <h4 className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">History</h4>
            <div className="space-y-0.5">
              {[1, 2, 3].map((i) => (
                <button key={i} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-card/60 hover:text-foreground rounded-lg transition-all group">
                   <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
                   <span className="truncate flex-1 text-left">Market Entry: Logistics</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto p-3 border-t border-border bg-sidebar/50">
           <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-card/60 transition-all cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-primary-bg border border-primary-border flex items-center justify-center text-primary text-xs font-bold ring-2 ring-background overflow-hidden">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name[0].toUpperCase()
                )}
              </div>
              <div className="flex flex-col flex-1 truncate text-left">
                <span className="text-sm font-semibold text-foreground truncate">{currentUser?.name}</span>
                <span className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-mono">USA Strategic</span>
              </div>
              <button 
                onClick={() => setCurrentPage('settings')}
                className={cn(
                  "p-1.5 rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-surface-mid",
                  currentPage === 'settings' && "text-primary bg-primary-bg border-primary-border"
                )}
              >
                <Settings size={16} />
              </button>
           </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-background">
        {/* Header - Layaa OS Style */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-40 relative">
           <div className="flex items-center gap-4 w-1/3">
              <AnimatePresence>
                {isLeftSidebarCollapsed && (
                  <motion.button 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => setIsLeftSidebarCollapsed(false)}
                    className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-all shadow-sm"
                  >
                    <PanelLeftClose size={18} className="rotate-180" />
                  </motion.button>
                )}
              </AnimatePresence>
           </div>
           
           <div className="flex-1 flex justify-center w-1/3">
              <div className="relative group w-full max-w-sm">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-foreground transition-colors" />
                 <div className="bg-surface-mid border border-border rounded-xl px-9 py-1.5 h-9 flex items-center w-full cursor-text hover:border-primary-border/50">
                    <span className="text-sm text-muted-foreground">Search anything...</span>
                    <kbd className="ml-auto text-[10px] text-muted-foreground font-mono bg-background border border-border px-1.5 py-0.5 rounded tracking-tighter">⌘K</kbd>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center justify-end gap-3 w-1/3">
              <div className="flex items-center gap-2 px-3 py-1 bg-surface-mid border border-border rounded-full hover:border-primary-border/40 transition-all cursor-pointer group" onClick={() => setIsBrutalHonesty(!isBrutalHonesty)}>
                 <div className={cn("w-2 h-2 rounded-full transition-all", isBrutalHonesty ? "bg-primary animate-pulse shadow-[0_0_8px_rgba(92,5,5,0.8)]" : "bg-muted-foreground/30")} />
                 <span className={cn("text-[10px] font-bold uppercase tracking-widest", isBrutalHonesty ? "text-primary" : "text-muted-foreground")}>Brutal Honesty Mode</span>
                 <span className="text-[9px] text-muted-foreground/50 font-mono ml-1">{isBrutalHonesty ? 'ON' : 'OFF'}</span>
              </div>

              {isRightSidebarCollapsed && (
                <button 
                  onClick={() => setIsRightSidebarCollapsed(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                >
                  <PanelRightClose size={18} className="rotate-180" />
                </button>
              )}
           </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 layaa-scroll pb-32">
          {currentPage === 'settings' ? (
            <SettingsLLM />
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-full space-y-6">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 w-full">
                  {/* Center Welcome */}
                  <div className="text-center space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 w-full">
                    <div className="relative inline-block">
                       <div className="w-16 h-16 bg-primary-bg border border-primary-border rounded-2xl flex items-center justify-center mx-auto transition-transform hover:rotate-3">
                          <Bot size={32} className="text-primary" strokeWidth={1.5} />
                       </div>
                       <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background" />
                    </div>
                    
                    <div className="space-y-4">
                      <h1 className="text-[32px] md:text-[42px] font-bold text-foreground tracking-tight leading-[1.1]">
                        Welcome to <span className="text-primary italic">CockRoach.</span>
                      </h1>
                      <p className="text-muted-foreground max-w-md mx-auto text-[15px] leading-relaxed">
                        Good morning, <span className="text-foreground font-semibold tracking-wider text-[13px]">{currentUser?.name}</span>. 
                        Your strategic intelligence platform is calibrated and ready for operations.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left mt-8">
                      <button 
                        onClick={() => setCurrentPage('research')}
                        className="layaa-card layaa-card-interactive p-5 flex flex-col group"
                      >
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                            <Search size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Intelligence Gateway</span>
                          <span className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Start 10-Vector Deep Research</span>
                          <p className="text-xs text-muted-foreground leading-relaxed">Execute a high-fidelity intelligence report covering Market Gap, Moats, and Scale Vectors.</p>
                      </button>
                      <button 
                        onClick={() => setCurrentPage('projects')}
                        className="layaa-card layaa-card-interactive p-5 flex flex-col group"
                      >
                          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                            <FolderKanban size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1.5">Strategic Workspace</span>
                          <span className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Macro Project Pipeline</span>
                          <p className="text-xs text-muted-foreground leading-relaxed">Manage your tactical roadmaps and monitor active CockRoach neural swarms in your workspace.</p>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  {messages.map((msg, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={cn(
                        "flex gap-4 p-4 rounded-2xl border",
                        msg.role === 'user' ? "bg-surface-mid border-border/50 ml-12" : "bg-card border-primary-border/20 mr-12"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-background border border-border overflow-hidden">
                        {msg.role === 'user' ? (
                          currentUser?.avatar ? <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" /> : <User size={16} />
                        ) : (
                          <Bot size={16} className="text-primary" />
                        )}
                      </div>
                      <div className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-4 p-4 mr-12">
                      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-background border border-border">
                        <Bot size={16} className="text-primary animate-pulse" />
                      </div>
                      <div className="flex gap-1.5 items-center mt-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Input - Bottom Panel */}
        {currentPage === 'chat' && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-12 z-20">
             <div className="max-w-3xl mx-auto relative group">
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl focus-within:border-primary/50 transition-all ring-primary/5 focus-within:ring-4">
                  <textarea 
                    placeholder="Brief CockRoach..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="w-full bg-transparent border-none p-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:ring-0 resize-none min-h-[56px] max-h-[200px] layaa-scroll"
                    rows={1}
                  />
                  <div className="flex items-center justify-between px-4 py-2 bg-surface-mid border-t border-border/50">
                    <div className="flex items-center gap-2">
                       <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-all">
                        <Plus size={18} />
                       </button>
                       <div className="h-4 w-[1px] bg-border mx-1" />
                       <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background border border-border rounded-full shadow-sm">
                          <div className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_rgba(45,90,39,0.5)]" />
                          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] px-1">CockRoach Neural</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-mono text-muted-foreground px-2">Enter ↵</span>
                       <button 
                         onClick={handleSendMessage}
                         disabled={!input.trim() || isTyping}
                         className="bg-primary disabled:opacity-50 hover:brightness-110 text-white p-1.5 rounded-lg transition-all active:scale-95 shadow-sm shadow-primary/30"
                       >
                        <ChevronRight size={20} />
                       </button>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Right Sidebar - Contextual Insights */}
      <motion.aside 
        initial={false}
        animate={{ width: isRightSidebarCollapsed ? 0 : 280 }}
        className={cn(
          "h-full bg-sidebar border-l border-border flex flex-col transition-all overflow-hidden relative shadow-sm z-30",
          isRightSidebarCollapsed && "border-none"
        )}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-sidebar/50">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Context</span>
          </div>
          <button 
            onClick={() => setIsRightSidebarCollapsed(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
          >
            <PanelRightClose size={16} className="rotate-180" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 layaa-scroll">
           <div className="space-y-3">
             <h4 className="text-[11px] font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
               <div className="w-1.5 h-1.5 rounded-sm bg-accent" />
               Latest Insights
             </h4>
             <div className="layaa-card p-3 space-y-2.5 bg-background shadow-xs">
                <p className="text-[12px] text-muted-foreground leading-relaxed">"Strategic direction shift noted: prioritize hyper-local Indian SME constraints over general APAC models."</p>
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">Confidence Index: 94%</span>
                  <Pin size={10} className="text-primary rotate-45" />
                </div>
             </div>
           </div>

           <div className="space-y-3">
             <h4 className="text-[11px] font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
               <div className="w-1.5 h-1.5 rounded-sm bg-primary" />
               Active Knowledge
             </h4>
             <div className="space-y-1.5">
                <div className="flex items-center justify-between px-3 py-2 bg-surface-mid border border-border rounded-xl text-[10px] group cursor-default shadow-xs hover:border-primary-border transition-all">
                  <span className="text-foreground font-medium">market_dynamics_delhi_ncr.pdf</span>
                  <span className="text-[9px] text-muted-foreground font-mono">1.2MB</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-surface-mid border border-border rounded-xl text-[10px] group cursor-default shadow-xs hover:border-primary-border transition-all">
                  <span className="text-foreground font-medium">vendor_risk_matrix.csv</span>
                  <span className="text-[9px] text-muted-foreground font-mono">45KB</span>
                </div>
             </div>
           </div>
        </div>

        <div className="mt-auto p-4 border-t border-border bg-sidebar/50">
           <div className="p-3 bg-surface-mid border border-border rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-black/10 -rotate-45 translate-x-3 -translate-y-3" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1.5 tracking-widest">Active Intelligence Phase</span>
              <p className="text-[11px] text-muted-foreground leading-snug font-medium italic">
                CockRoach is currently analyzing the logistics gap in Tier-2 Indian cities based on your uploaded dataset.
              </p>
           </div>
        </div>
      </motion.aside>

      {/* Floating Reveal for Hidden Right Sidebar */}
      <AnimatePresence>
        {isRightSidebarCollapsed && (
          <motion.button 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            onClick={() => setIsRightSidebarCollapsed(false)}
            className="absolute right-4 top-4 z-50 p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-all shadow-md active:scale-95"
          >
            <PanelRightClose size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
