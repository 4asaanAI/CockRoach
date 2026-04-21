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
  Bell,
  RefreshCcw,
  Trash2,
  Lightbulb,
  ShieldCheck,
  Briefcase,
  Rocket,
  Image as ImageIcon,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { supabase } from './lib/supabase';
import SettingsLLM from './components/SettingsLLM';
import ProfileSelector from './components/ProfileSelector';
import { Toaster, toast } from 'sonner';

const APP_MODES = [
  { id: 'IDEA_GENERATION', icon: Lightbulb, label: 'Generate Ideas' },
  { id: 'IDEA_VALIDATION', icon: ShieldCheck, label: 'Validate Idea' },
  { id: 'DEEP_RESEARCH', icon: Search, label: 'Research Market' },
  { id: 'THINKING', icon: Brain, label: 'Think Deeply' },
  { id: 'BUSINESS_MODEL', icon: Briefcase, label: 'Business Model' },
  { id: 'POSITIONING', icon: Rocket, label: 'Brand & Positioning' },
  { id: 'IMAGE_PROMPTING', icon: ImageIcon, label: 'Create Visual Prompt' },
  { id: 'EXECUTION', icon: CheckSquare, label: 'Build Plan' },
];

export default function App() {
  const { currentUser, setAzureConfig, azureConfig, setCurrentUser } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [authChecking, setAuthChecking] = React.useState(true);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = React.useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = React.useState(false);
  const [activeMode, setActiveMode] = React.useState('IDEA_GENERATION');
  const [isModeSelectOpen, setIsModeSelectOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<'chat' | 'settings' | 'research' | 'memory' | 'projects'>('chat');
  const [isBrutalHonesty, setIsBrutalHonesty] = React.useState(false);
  
  // Chat State
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<{ id?: string, role: 'user' | 'assistant', content: string | React.ReactNode, rawText?: string }[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [chatHistory, setChatHistory] = React.useState<any[]>([]);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Replaces Auth cycle with direct sync check
    if (currentUser?.id) {
       syncLocalUserWithDatabase(currentUser);
    } else {
       setIsAuthenticated(false);
       setAuthChecking(false);
    }
  }, [currentUser?.id]); // STRICT ID DEPENDENCY TO PREVENT INFINITE SETTINGS LOOPS

  const syncLocalUserWithDatabase = async (user: any) => {
    try {
      setIsAuthenticated(true);
      
      // Load User Config
      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', user.id).single();
      
      if (userError && userError.code !== 'PGRST116') {
         console.error('User Fetch Error:', userError);
         toast.error(`Database Error: ${userError.message}`);
      }
      
      if (!userData) {
         const { error: insertUserError } = await supabase.from('users').insert({ id: user.id, name: user.name, email: user.email, avatar: user.avatar || '' });
         if (insertUserError) toast.error(`User Creation Error: ${insertUserError.message}`);
      } else if (userData.name !== user.name || userData.email !== user.email || userData.avatar !== user.avatar) {
         const { error: updateError } = await supabase.from('users').update({ name: user.name, email: user.email, avatar: user.avatar || '' }).eq('id', user.id);
         if (updateError) toast.error(`Profile Sync Warning: ${updateError.message}`);
      }

      // Load Azure Config
      const { data: configData, error: configError } = await supabase.from('azure_configs').select('*').eq('user_id', user.id).single();
      if (configError && configError.code !== 'PGRST116') {
         toast.error(`Config Fetch Error: ${configError.message}`);
      }

      if (configData) {
         setAzureConfig({ apiKey: configData.api_key, endpoint: configData.endpoint, deployment: configData.deployment, model: configData.model, version: configData.version });
      } else {
         const defaultConfig = {
           user_id: user.id,
           api_key: 'DKUDyLkncgn1VtOAfJAA9wQdRAOrbQCD2bjLnme8dTlfElC5n1mLJQQJ99CDACYeBjFXJ3w3AAAAACOGNEId',
           endpoint: 'https://layaaos.cognitiveservices.azure.com/',
           deployment: 'CockRoach_2.0',
           model: 'gpt-5.1-chat',
           version: '2024-12-01-preview'
         };
         const { error: insertConfigError } = await supabase.from('azure_configs').insert(defaultConfig);
         if (insertConfigError) toast.error(`Config Creation Error: ${insertConfigError.message}`);
         setAzureConfig({ apiKey: defaultConfig.api_key, endpoint: defaultConfig.endpoint, deployment: defaultConfig.deployment, model: defaultConfig.model, version: defaultConfig.version });
      }

      await loadChatHistory(user.id);
    } catch (e: any) {
      console.error('Error syncing user:', e);
      toast.error(`Critical Sync Error: ${e.message}`);
    } finally {
      setAuthChecking(false);
    }
  };

  const loadChatHistory = async (userId: string) => {
    const { data: chats, error } = await supabase.from('chats').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (error) {
       toast.error(`History Sync Error: ${error.message}`);
       return;
    }
    if (chats) {
       setChatHistory(chats.map(c => ({ id: c.id, title: c.title, updatedAt: c.updated_at })));
    }
  };

  React.useEffect(() => {
    if (!currentUser || !activeChatId) return;
    const fetchMessages = async () => {
      const { data: msgs, error } = await supabase.from('messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true });
      
      if (error) { toast.error(`Message Sync Error: ${error.message}`); }
      
      if (msgs) {
         setMessages(msgs.map(m => ({
           id: m.id,
           role: m.role as any,
           content: m.content,
           rawText: m.raw_text
         })));
      }
    };
    fetchMessages();
  }, [activeChatId, currentUser]);

  React.useEffect(() => {
    // robust scroll to bottom
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      const fileContentStr = typeof text === 'string' ? text : 'Binary file';
      
      let currentChatId = activeChatId;

      try {
        if (!currentChatId) {
          const { data: chatData, error: chatErr } = await supabase.from('chats').insert({
            user_id: currentUser.id,
            title: `File: ${file.name}`.substring(0, 40) + '...'
          }).select().single();
          
          if (chatErr) throw chatErr;
          
          if (chatData) {
             currentChatId = chatData.id;
             setActiveChatId(currentChatId);
             await loadChatHistory(currentUser.id);
          }
        } else {
          await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', currentChatId);
          await loadChatHistory(currentUser.id);
        }

        if (currentChatId) {
          // Add File Message to Supabase
          const { data: userMsg } = await supabase.from('messages').insert({
            chat_id: currentChatId,
            role: 'user',
            content: `Attached File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
            raw_text: `[File attached: ${file.name}]\n\nContent:\n${fileContentStr.substring(0, 3000)}`
          }).select().single();
          
          if (userMsg) {
             setMessages(prev => [...prev, { id: userMsg.id, role: 'user', content: userMsg.content, rawText: userMsg.raw_text }]);
          } else {
             setMessages(prev => [...prev, { role: 'user', content: `Attached File: ${file.name}` }]);
          }

          // Simulate reading
          setTimeout(async () => {
             const { data: assistMsg } = await supabase.from('messages').insert({
                chat_id: currentChatId!,
                role: 'assistant',
                content: `I have ingested "${file.name}" and extracted its contents. The telemetry data has been injected into our current context. You may now query against it.`
              }).select().single();
              
              if (assistMsg) {
                 setMessages(prev => [...prev, { id: assistMsg.id, role: 'assistant', content: assistMsg.content }]);
              }
          }, 1500);
        }

      } catch (err: any) {
        console.error('Failed to upload file:', err);
        toast.error(`File Write Error: ${err.message}`);
      }
    };

    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping || !currentUser) return;
    
    const userMsg = input.trim();
    setInput('');
    setIsTyping(true);

    let currentChatId = activeChatId;

    try {
      if (!currentChatId) {
        const { data: chatData, error } = await supabase.from('chats').insert({
          user_id: currentUser.id,
          title: userMsg.substring(0, 40) + '...'
        }).select().single();
        if (error) { toast.error(`Chat Init Error: ${error.message}`); throw error; }
        currentChatId = chatData.id;
        setActiveChatId(currentChatId);
        await loadChatHistory(currentUser.id);
      } else {
        const { error } = await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', currentChatId);
        if (error) { toast.error(`Chat Update Error: ${error.message}`); }
        await loadChatHistory(currentUser.id);
      }

      const { data: insertedUserMsg, error: msgError } = await supabase.from('messages').insert({
        chat_id: currentChatId,
        role: 'user',
        content: userMsg
      }).select().single();

      if (msgError) { toast.error(`Database Write Error: ${msgError.message}`); throw msgError; }

      if (insertedUserMsg) {
         setMessages(prev => [...prev, { id: insertedUserMsg.id, role: 'user', content: insertedUserMsg.content }]);
      } else {
         setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      }

      const baseUrl = azureConfig.endpoint.endsWith('/') ? azureConfig.endpoint.slice(0, -1) : azureConfig.endpoint;
      const url = `${baseUrl}/openai/deployments/${azureConfig.deployment}/chat/completions?api-version=${azureConfig.version}`;
      
      const newMessagesForAPI = [...messages.map(m => ({
        role: m.role,
        content: m.rawText ? m.rawText : (typeof m.content === 'string' ? m.content : '[File Attached]')
      })), { role: 'user', content: userMsg }];

      const activeModeData = APP_MODES.find(m => m.id === activeMode);
      const systemPrompt = `You are an advanced entrepreneurial intelligence copilot named CockRoach, embedded inside a custom web app for brainstorming, refining, validating, and stress-testing startup and business ideas.
Your role is to help the user move from vague inspiration to clear, testable, high-quality business concepts. You must operate like a suite of specialized tools inside one assistant.

---
CURRENT OPERATING MODE: ${activeModeData?.id || 'IDEA_GENERATION'} (${activeModeData?.label})

When responding, determine which mode is most useful based on the user's request. If unclear, ask a short clarifying question or provide a structured response with assumptions.

- If IDEA_GENERATION: Generate specific, differentiated, feasible, monetizable, testable ideas. Include idea name, target customer, problem, solution, why now, business model, MVP, validation test, key risks.
- If IDEA_VALIDATION: Evaluate ideas with healthy skepticism. Identify strengths, weaknesses, assumptions, critical unknowns, validation experiments, and a go/maybe/no-go recommendation.
- If DEEP_RESEARCH: Produce structured, analyst-style outputs. Include market overview, customer segments, competitors, substitutes, trends, risks, whitespace opportunities. Ask for connection config if live data is needed.
- If THINKING: Break down complex problems. Compare options (first principles, pros/cons, risk vs upside). Provide summary, assumptions, conclusion, next action.
- If BUSINESS_MODEL: Help design pricing, GTM, retention, revenue streams, cost structure. Realism over theory.
- If POSITIONING: Clarify audience and problem. Generate one-line positioning, elevator pitch, landing page headline, value props.
- If IMAGE_PROMPTING: Create high-quality prompts for image tools (subject, composition, style, lighting, color palette).
- If EXECUTION: Convert strategy into action plans (7-day plan, MVP roadmap, validation checklist).

The user is ${currentUser?.name}. 
${isBrutalHonesty ? 'CRITICAL: BRUTAL HONESTY MODE IS ON. Respond with brutal honesty, explicitly highlighting critical flaws, blindspots, and weak assumptions directly without sugar-coating.' : ''}
`;

      const response = await fetch(url.replace(/([^:]\/)\/+/g, "$1"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureConfig.apiKey
        },
        body: JSON.stringify({
          model: azureConfig.deployment || azureConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessagesForAPI
          ],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Azure Error: ${err.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      const { data: insertedAsstMsg } = await supabase.from('messages').insert({
        chat_id: currentChatId,
        role: 'assistant',
        content: data.choices[0].message.content
      }).select().single();

      if (insertedAsstMsg) {
         setMessages(prev => [...prev, { id: insertedAsstMsg.id, role: 'assistant', content: insertedAsstMsg.content }]);
      } else {
         setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      }

    } catch (error: any) {
      console.error(error);
      const errorMsg = `Neural connection interrupted: ${error.message}`;
      if (currentChatId) {
        const { data: errData } = await supabase.from('messages').insert({
          chat_id: currentChatId,
          role: 'assistant',
          content: errorMsg
        }).select().single();
        if (errData) {
            setMessages(prev => [...prev, { id: errData.id, role: 'assistant', content: errData.content }]);
            return;
        }
      }
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (authChecking) {
    return <div className="h-screen w-full bg-background flex items-center justify-center">
       <Bot size={34} className="text-primary animate-pulse" />
    </div>;
  }

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
          <button 
            onClick={() => {
              setMessages([]);
              setActiveChatId(null);
              setCurrentPage('chat');
            }} 
            className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold h-10 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-6 layaa-scroll">
          <div className="pt-2">
            <h4 className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">History</h4>
            <div className="space-y-0.5">
              {chatHistory.map((historyItem) => (
                <button 
                  key={historyItem.id} 
                  onClick={() => {
                    setActiveChatId(historyItem.id);
                    setCurrentPage('chat');
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-card/60 hover:text-foreground rounded-lg transition-all group",
                    activeChatId === historyItem.id && "bg-card/60 text-foreground"
                  )}
                >
                   <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", activeChatId === historyItem.id ? "bg-primary" : "bg-border group-hover:bg-primary/50")} />
                   <span className="truncate flex-1 text-left">{historyItem.title}</span>
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
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-lg transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Logout"
              >
                <LogOut size={16} />
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

        <div className="flex-1 overflow-y-auto px-6 py-6 layaa-scroll pb-32" ref={chatScrollRef}>
          {currentPage === 'settings' ? (
            <SettingsLLM />
          ) : currentPage === 'research' ? (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-full space-y-4 animate-in fade-in slide-in-from-bottom-5">
              <Search size={48} className="text-primary opacity-50" />
              <h2 className="text-xl font-bold text-foreground">Deep Research Module</h2>
              <p className="text-muted-foreground text-sm max-w-md text-center">
                Configure your search vectors and target parameters below. This module is undergoing calibration.
              </p>
            </div>
          ) : currentPage === 'memory' ? (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-full space-y-4 animate-in fade-in slide-in-from-bottom-5">
              <Brain size={48} className="text-primary opacity-50" />
              <h2 className="text-xl font-bold text-foreground">Strategic Memory Bank</h2>
              <p className="text-muted-foreground text-sm max-w-md text-center">
                Review and modify your CockRoach neural memory embeddings.
              </p>
            </div>
          ) : currentPage === 'projects' ? (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-full space-y-4 animate-in fade-in slide-in-from-bottom-5">
              <FolderKanban size={48} className="text-primary opacity-50" />
              <h2 className="text-xl font-bold text-foreground">Macro Projects Pipeline</h2>
              <p className="text-muted-foreground text-sm max-w-md text-center">
                Active operations and strategic blueprints will appear here. No active projects detected.
              </p>
            </div>
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
                        CockRoach is primed in <span className="text-primary font-bold">{APP_MODES.find(m => m.id === activeMode)?.label}</span> mode.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left mt-8">
                       {APP_MODES.slice(0, 4).map(mode => (
                         <button 
                           key={mode.id}
                           onClick={() => setActiveMode(mode.id)}
                           className={cn("layaa-card layaa-card-interactive p-5 flex flex-col group", activeMode === mode.id && "ring-2 ring-primary")}
                         >
                             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                               <mode.icon size={20} />
                             </div>
                             <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">{mode.label}</span>
                             <p className="text-xs text-muted-foreground leading-relaxed">Engage CockRoach for {mode.label.toLowerCase()} framework intelligence.</p>
                         </button>
                       ))}
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
                      <div className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap overflow-hidden break-words max-w-full">
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
                  <div ref={messagesEndRef} className="h-4 w-full opacity-0" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Input - Bottom Panel */}
        {currentPage === 'chat' && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-12 z-20">
             {isModeSelectOpen && (
               <div className="fixed inset-0 z-40" onClick={() => setIsModeSelectOpen(false)} />
             )}
             <div className="max-w-3xl mx-auto relative group z-50">
                <div className="bg-card/90 backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] focus-within:border-primary/50 transition-all focus-within:shadow-[0_12px_40px_-12px_rgba(255,255,255,0.1)] focus-within:ring-1 focus-within:ring-primary/30">
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
                    className="w-full bg-transparent border-none p-5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 resize-none min-h-[64px] max-h-[200px] layaa-scroll rounded-t-[28px]"
                    rows={1}
                  />
                  <div className="flex items-center justify-between px-5 py-3 bg-surface-mid/40 rounded-b-[28px] border-t border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         onChange={handleFileUpload} 
                       />
                       <button 
                         onClick={() => fileInputRef.current?.click()} 
                         className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all"
                         title="Attach File"
                       >
                        <Plus size={18} />
                       </button>
                       <div className="h-5 w-[1px] bg-border mx-1" />
                       <div className="relative">
                          {isModeSelectOpen && (
                              <div className="absolute bottom-full mb-4 left-0 w-64 bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 origin-bottom-left">
                                  <div className="max-h-[320px] overflow-y-auto layaa-scroll p-2 space-y-0.5">
                                      {APP_MODES.map(mode => (
                                          <button
                                              key={mode.id}
                                              onClick={() => { setActiveMode(mode.id); setIsModeSelectOpen(false); }}
                                              className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-left rounded-xl transition-all", activeMode === mode.id ? "text-primary bg-primary/10 shadow-inner" : "text-foreground hover:bg-white/5")}
                                          >
                                              <mode.icon size={16} className={activeMode === mode.id ? "text-primary" : "text-muted-foreground"} />
                                              <span className="truncate tracking-wide">{mode.label}</span>
                                              {activeMode === mode.id && <Pin size={12} className="ml-auto opacity-50" />}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}
                          <button 
                             onClick={() => setIsModeSelectOpen(!isModeSelectOpen)}
                             className={cn("flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full shadow-sm hover:border-primary/50 transition-all", isModeSelectOpen ? "border-primary/50 ring-2 ring-primary/20 bg-primary/5" : "border-white/10")}
                          >
                             <div className="w-2 h-2 bg-success rounded-full shadow-[0_0_8px_rgba(45,90,39,0.8)]" />
                             <span className="text-[11px] font-bold text-primary uppercase tracking-[0.15em] px-1">{APP_MODES.find(m => m.id === activeMode)?.label || 'Neural'}</span>
                          </button>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[11px] font-mono font-medium text-muted-foreground px-2">Return ↵</span>
                       <button 
                         onClick={handleSendMessage}
                         disabled={!input.trim() || isTyping}
                         className="bg-primary disabled:opacity-50 hover:brightness-[1.15] text-background p-2 rounded-xl transition-all active:scale-90 shadow-[0_0_15px_rgba(var(--primary),0.4)] disabled:shadow-none"
                       >
                        <ChevronRight size={18} strokeWidth={3} />
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

        <div className="flex-1 overflow-y-auto p-4 space-y-6 layaa-scroll flex flex-col items-center justify-center text-center">
           <Brain size={32} className="text-muted-foreground/30 mb-2" />
           <p className="text-[11px] font-medium text-muted-foreground leading-relaxed max-w-[200px]">
              No active intelligence streams detected. Upload files or query CockRoach to populate dynamic context arrays.
           </p>
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
