import React from 'react';
import { useAppStore } from './store';
import { cn } from './lib/utils';
import {
  Search,
  Plus,
  FolderKanban,
  Settings,
  User,
  PanelLeftClose,
  PanelRightClose,
  ChevronRight,
  Pin,
  LogOut,
  Brain,
  Bot,
  Trash2,
  Lightbulb,
  ShieldCheck,
  Briefcase,
  Rocket,
  Image as ImageIcon,
  CheckSquare,
  Pencil,
  Check,
  X,
  Copy,
  FileText,
  Share2,
  Link,
  Users,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  MoreHorizontal,
  FileDown,
  Globe,
} from 'lucide-react';
import DocumentViewer from './components/DocumentViewer';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { detectUrls, scrapeUrl, getUrlDomain, buildUrlContext, type UrlPreview } from './lib/url-scraper';
import MermaidDiagram from './components/MermaidDiagram';

import { supabase } from './lib/supabase';
import SettingsLLM from './components/SettingsLLM';
import ProfileSelector from './components/ProfileSelector';
import { Toaster, toast } from 'sonner';
import { buildSystemPrompt } from './lib/system-prompt-builder';
import { COCKROACH_DEFAULT_SYSTEM_PROMPT } from './lib/kb-constants';

const APP_MODES = [
  { id: 'GENERAL', icon: Bot, label: 'General Chat' },
  { id: 'IDEA_GENERATION', icon: Lightbulb, label: 'Generate Ideas' },
  { id: 'IDEA_VALIDATION', icon: ShieldCheck, label: 'Validate Idea' },
  { id: 'DEEP_RESEARCH', icon: Search, label: 'Research Market' },
  { id: 'THINKING', icon: Brain, label: 'Think Deeply' },
  { id: 'BUSINESS_MODEL', icon: Briefcase, label: 'Business Model' },
  { id: 'POSITIONING', icon: Rocket, label: 'Brand & Positioning' },
  { id: 'IMAGE_PROMPTING', icon: ImageIcon, label: 'Create Visual Prompt' },
  { id: 'EXECUTION', icon: CheckSquare, label: 'Build Plan' },
];

const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({children}) => <h1 className="text-xl font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h1>,
  h2: ({children}) => <h2 className="text-lg font-bold text-foreground mt-5 mb-2 first:mt-0 pb-1 border-b border-border/50">{children}</h2>,
  h3: ({children}) => <h3 className="text-[15px] font-bold text-foreground mt-4 mb-1.5 first:mt-0">{children}</h3>,
  h4: ({children}) => <h4 className="text-[14px] font-semibold text-foreground/90 mt-3 mb-1">{children}</h4>,
  p: ({children}) => <p className="text-[14px] text-foreground leading-7 mb-3 last:mb-0">{children}</p>,
  ul: ({children}) => <ul className="my-2 space-y-1 list-none pl-0">{children}</ul>,
  ol: ({children}) => <ol className="my-2 space-y-1 list-decimal pl-5">{children}</ol>,
  li: ({children}) => <li className="text-[14px] text-foreground leading-6 flex gap-2 items-start"><span className="text-primary mt-1.5 shrink-0">›</span><span>{children}</span></li>,
  strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
  em: ({children}) => <em className="italic text-muted-foreground">{children}</em>,
  blockquote: ({children}) => <blockquote className="border-l-2 border-primary pl-4 my-3 text-muted-foreground italic">{children}</blockquote>,
  code: ({children, className}: any) => {
    const lang = className?.replace('language-', '');
    if (lang === 'mermaid') {
      return <MermaidDiagram code={String(children).trim()} />;
    }
    const isBlock = !!className?.includes('language-');
    return isBlock
      ? <code className="block bg-background border border-border rounded-lg p-3 text-[12px] font-mono text-foreground overflow-x-auto my-3 whitespace-pre">{children}</code>
      : <code className="bg-background border border-border rounded px-1.5 py-0.5 text-[12px] font-mono text-primary">{children}</code>;
  },
  pre: ({children}) => <>{children}</>,
  table: ({children}) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-[13px]">{children}</table>
    </div>
  ),
  thead: ({children}) => <thead className="bg-surface-mid">{children}</thead>,
  th: ({children}) => <th className="text-left px-3 py-2 font-bold text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border">{children}</th>,
  td: ({children}) => <td className="px-3 py-2 text-foreground border-b border-border/50 last:border-b-0">{children}</td>,
  tr: ({children}) => <tr className="hover:bg-card/40 transition-colors">{children}</tr>,
  hr: () => <hr className="my-4 border-border" />,
  a: ({href, children}: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:brightness-110">{children}</a>,
};

export default function App() {
  const { currentUser, setAzureConfig, azureConfig, setCurrentUser, kbToggles, memoryItems, setMemoryItems, systemPrompt, setSystemPrompt } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [authChecking, setAuthChecking] = React.useState(true);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = React.useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = React.useState(false);
  const [activeMode, setActiveMode] = React.useState('GENERAL');
  const [sessionTokens, setSessionTokens] = React.useState({ prompt: 0, completion: 0 });
  const [isModeSelectOpen, setIsModeSelectOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<'chat' | 'settings' | 'research' | 'memory' | 'projects'>('chat');
  const [isBrutalHonesty, setIsBrutalHonesty] = React.useState(false);

  // Chat State
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<{ id?: string, role: 'user' | 'assistant', content: string, rawText?: string, isSummary?: boolean }[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState('');
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [chatHistory, setChatHistory] = React.useState<any[]>([]);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [shareLink, setShareLink] = React.useState<string | null>(null);
  const [showAnalysisButton, setShowAnalysisButton] = React.useState(false);
  const [documentViewerContent, setDocumentViewerContent] = React.useState<string | null>(null);
  const [messageRatings, setMessageRatings] = React.useState<Record<string, 'up' | 'down'>>({});
  const [editingUserMsgId, setEditingUserMsgId] = React.useState<string | null>(null);
  const [hoveredMsgKey, setHoveredMsgKey] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<{ chats: any[]; messages: any[] }>({ chats: [], messages: [] });
  const [sharedChatBanner, setSharedChatBanner] = React.useState<string | null>(null);
  const [quickMemory, setQuickMemory] = React.useState('');
  const [urlPreviews, setUrlPreviews] = React.useState<Map<string, UrlPreview>>(new Map());
  // msgId → original document content (for "View Full Report" action on summary msgs)
  const [summaryMeta, setSummaryMeta] = React.useState<Map<string, string>>(new Map());
  const searchRef = React.useRef<HTMLInputElement>(null);

  const IDEA_KEYWORDS = ['idea', 'startup', 'app', 'platform', 'saas', 'business', 'product', 'build', 'create', 'launch', 'solve', 'monetize', 'users', 'customers', 'service', 'tool', 'software', 'company'];
  const detectStartupIdea = (text: string): boolean => {
    const lower = text.toLowerCase();
    return IDEA_KEYWORDS.filter(kw => lower.includes(kw)).length >= 2;
  };

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
           model: 'gpt-5.3-chat',
           version: '2024-12-01-preview'
         };
         const { error: insertConfigError } = await supabase.from('azure_configs').insert(defaultConfig);
         if (insertConfigError) toast.error(`Config Creation Error: ${insertConfigError.message}`);
         setAzureConfig({ apiKey: defaultConfig.api_key, endpoint: defaultConfig.endpoint, deployment: defaultConfig.deployment, model: defaultConfig.model, version: defaultConfig.version });
      }

      await loadChatHistory(user.id);
      await loadSystemPrompt(user.id);
      await loadMemoryItems(user.id);
    } catch (e: any) {
      console.error('Error syncing user:', e);
      toast.error(`Critical Sync Error: ${e.message}`);
    } finally {
      setAuthChecking(false);
    }
  };

  const loadSystemPrompt = async (userId: string) => {
    const { data } = await supabase.from('system_prompts').select('prompt, kb_01_enabled, kb_02_enabled, kb_03_enabled, kb_04_enabled').eq('user_id', userId).single();
    if (data) {
      setSystemPrompt(data.prompt);
    } else {
      setSystemPrompt(COCKROACH_DEFAULT_SYSTEM_PROMPT);
    }
  };

  const loadMemoryItems = async (userId: string) => {
    const { data } = await supabase.from('memory_items').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setMemoryItems(data);
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from('chats').update({ title: newTitle.trim() }).eq('id', chatId);
    if (error) { toast.error('Rename failed'); return; }
    setChatHistory(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle.trim() } : c));
    setRenamingChatId(null);
  };

  const handleDeleteChat = async (chatId: string) => {
    const { error } = await supabase.from('chats').delete().eq('id', chatId);
    if (error) { toast.error('Delete failed'); return; }
    setChatHistory(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
    }
    toast.success('Conversation deleted.');
  };

  const handleShareChat = async () => {
    if (!activeChatId) return;
    // Generate or fetch existing share token
    let token: string;
    const { data: existing } = await supabase.from('chats').select('share_token').eq('id', activeChatId).single();
    if (existing?.share_token) {
      token = existing.share_token;
    } else {
      token = crypto.randomUUID();
      await supabase.from('chats').update({ share_token: token }).eq('id', activeChatId);
    }
    const link = `${window.location.origin}${window.location.pathname}?shared=${token}`;
    setShareLink(link);
    navigator.clipboard.writeText(link);
    toast.success('Share link copied to clipboard!');
  };

  // On mount, check for ?shared= param — load that chat in read/write view with banner
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedToken = params.get('shared');
    if (sharedToken && currentUser) {
      supabase.from('chats').select('id, title, user_id').eq('share_token', sharedToken).single().then(async ({ data }) => {
        if (data) {
          window.history.replaceState({}, '', window.location.pathname);
          setActiveChatId(data.id);
          setCurrentPage('chat');
          if (data.user_id !== currentUser.id) {
            // Load owner name for banner
            const { data: owner } = await supabase.from('users').select('name').eq('id', data.user_id).single();
            setSharedChatBanner(`Shared chat from ${owner?.name || 'another user'} — "${data.title}"`);
          } else {
            setSharedChatBanner(`Share link active — this is your shared chat "${data.title}"`);
          }
        } else {
          toast.error('Share link expired or invalid.');
        }
      });
    }
  }, [currentUser?.id]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchFocused(true);
      }
      if (e.key === 'Escape') { setSearchFocused(false); setSearchQuery(''); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const buildAzureUrl = () => {
    const base = azureConfig.endpoint.endsWith('/') ? azureConfig.endpoint.slice(0, -1) : azureConfig.endpoint;
    return `${base}/openai/deployments/${azureConfig.deployment}/chat/completions?api-version=${azureConfig.version}`;
  };

  const streamAzureResponse = async (
    apiMessages: { role: string; content: string }[],
    onChunk: (text: string) => void
  ): Promise<string> => {
    const url = buildAzureUrl().replace(/([^:]\/)\/+/g, '$1');
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': azureConfig.apiKey },
      body: JSON.stringify({
        model: azureConfig.deployment || azureConfig.model,
        messages: apiMessages,
        temperature: 0.7,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(`Azure Error: ${err.error?.message || resp.statusText}`);
    }

    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) { full += delta; onChunk(full); }
          if (parsed.usage) {
            setSessionTokens(prev => ({
              prompt: prev.prompt + (parsed.usage.prompt_tokens || 0),
              completion: prev.completion + (parsed.usage.completion_tokens || 0),
            }));
          }
        } catch { /* skip malformed chunk */ }
      }
    }
    return full;
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
    if (fileInputRef.current) fileInputRef.current.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      const fileContentStr = typeof text === 'string' ? text : '[Binary file — cannot extract text]';
      let currentChatId = activeChatId;

      try {
        if (!currentChatId) {
          const { data: chatData, error: chatErr } = await supabase.from('chats').insert({
            user_id: currentUser.id,
            title: `File: ${file.name}`.substring(0, 45),
          }).select().single();
          if (chatErr) throw chatErr;
          currentChatId = chatData.id;
          setActiveChatId(currentChatId);
          await loadChatHistory(currentUser.id);
        } else {
          await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', currentChatId);
          await loadChatHistory(currentUser.id);
        }

        const displayContent = `📄 **${file.name}** (${(file.size / 1024).toFixed(1)} KB)`;
        const rawText = `[File: ${file.name}]\n\n${fileContentStr.substring(0, 8000)}`;

        const { data: userMsg } = await supabase.from('messages').insert({
          chat_id: currentChatId,
          role: 'user',
          content: displayContent,
          raw_text: rawText,
        }).select().single();

        setMessages(prev => [...prev, {
          id: userMsg?.id,
          role: 'user',
          content: displayContent,
          rawText,
        }]);

        // Real LLM analysis of the file
        setIsTyping(true);
        setStreamingContent('');
        const builtPrompt = buildSystemPrompt({
          systemPromptBase: systemPrompt || COCKROACH_DEFAULT_SYSTEM_PROMPT,
          kbToggles, memoryItems, activeMode,
          userName: currentUser.name, isBrutalHonesty,
        });

        const apiMessages = [
          { role: 'system', content: builtPrompt },
          ...messages.map(m => ({ role: m.role, content: m.rawText || m.content })),
          { role: 'user', content: rawText },
        ];

        setIsTyping(false);
        const fullContent = await streamAzureResponse(apiMessages, (partial) => {
          setStreamingContent(partial);
        });
        setStreamingContent('');

        const { data: assistMsg } = await supabase.from('messages').insert({
          chat_id: currentChatId!,
          role: 'assistant',
          content: fullContent,
        }).select().single();

        setMessages(prev => [...prev, { id: assistMsg?.id, role: 'assistant', content: fullContent }]);

      } catch (err: any) {
        setIsTyping(false);
        setStreamingContent('');
        toast.error(`File analysis failed: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  const handleSendMessage = async (overrideText?: string) => {
    const rawText = overrideText ?? input.trim();
    if (!rawText || isTyping || streamingContent || !currentUser) return;

    const userMsg = rawText;
    if (!overrideText) setInput('');
    setShowAnalysisButton(false);
    setIsTyping(true);
    setStreamingContent('');

    let currentChatId = activeChatId;

    try {
      if (!currentChatId) {
        const { data: chatData, error } = await supabase.from('chats').insert({
          user_id: currentUser.id,
          title: userMsg.substring(0, 50),
        }).select().single();
        if (error) { toast.error(`Chat Init Error: ${error.message}`); throw error; }
        currentChatId = chatData.id;
        setActiveChatId(currentChatId);
        await loadChatHistory(currentUser.id);
      } else {
        await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', currentChatId);
        await loadChatHistory(currentUser.id);
      }

      const { data: insertedUserMsg, error: msgError } = await supabase.from('messages').insert({
        chat_id: currentChatId,
        role: 'user',
        content: userMsg,
      }).select().single();

      if (msgError) { toast.error(`Write Error: ${msgError.message}`); throw msgError; }
      setMessages(prev => [...prev, { id: insertedUserMsg?.id, role: 'user', content: userMsg }]);

      const builtPrompt = buildSystemPrompt({
        systemPromptBase: systemPrompt || COCKROACH_DEFAULT_SYSTEM_PROMPT,
        kbToggles, memoryItems, activeMode,
        userName: currentUser.name, isBrutalHonesty,
      });

      const urlCtx = buildUrlContext(urlPreviews);
      const apiMessages = [
        { role: 'system', content: builtPrompt },
        ...messages.map(m => ({ role: m.role, content: m.rawText || m.content })),
        { role: 'user', content: urlCtx ? `${userMsg}${urlCtx}` : userMsg },
      ];

      setIsTyping(false);
      const fullContent = await streamAzureResponse(apiMessages, (partial) => {
        setStreamingContent(partial);
      });
      setStreamingContent('');
      setUrlPreviews(new Map());

      const { data: insertedAsstMsg } = await supabase.from('messages').insert({
        chat_id: currentChatId,
        role: 'assistant',
        content: fullContent,
      }).select().single();

      setMessages(prev => [...prev, { id: insertedAsstMsg?.id, role: 'assistant', content: fullContent }]);

      // Idea detection — offer full analysis if the user described a startup idea
      if (!overrideText && detectStartupIdea(userMsg)) {
        setShowAnalysisButton(true);
      }

    } catch (error: any) {
      console.error(error);
      setIsTyping(false);
      setStreamingContent('');
      const errorMsg = `🪲 Lost signal. We've survived worse. (${error.message})`;
      if (currentChatId) {
        const { data: errData } = await supabase.from('messages').insert({
          chat_id: currentChatId, role: 'assistant', content: errorMsg,
        }).select().single();
        setMessages(prev => [...prev, { id: errData?.id, role: 'assistant', content: errorMsg }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      }
    }
  };

  // ── Search ────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !currentUser) {
      setSearchResults({ chats: [], messages: [] });
      return;
    }
    const timer = setTimeout(async () => {
      const q = `%${searchQuery}%`;
      const [{ data: chats }, { data: msgs }] = await Promise.all([
        supabase.from('chats').select('id, title, updated_at').eq('user_id', currentUser.id).ilike('title', q).limit(5),
        supabase.from('messages').select('id, chat_id, content, role').ilike('content', q).limit(8),
      ]);
      // Tag messages with their chat title
      const chatIds = [...new Set((msgs || []).map(m => m.chat_id))];
      let chatMap: Record<string, string> = {};
      if (chatIds.length) {
        const { data: chatRows } = await supabase.from('chats').select('id, title').in('id', chatIds);
        chatMap = Object.fromEntries((chatRows || []).map(c => [c.id, c.title]));
      }
      const taggedMsgs = (msgs || []).filter(m => m.role !== 'system').map(m => ({ ...m, chatTitle: chatMap[m.chat_id] || 'Untitled' }));
      setSearchResults({ chats: chats || [], messages: taggedMsgs });
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  const handleSearchSelect = (chatId: string) => {
    setActiveChatId(chatId);
    setCurrentPage('chat');
    setSearchQuery('');
    setSearchFocused(false);
  };

  // ── Quick memory add from right sidebar ──────────────────────────────
  const handleQuickAddMemory = async () => {
    if (!quickMemory.trim() || !currentUser) return;
    const { data, error } = await supabase.from('memory_items').insert({ user_id: currentUser.id, content: quickMemory.trim(), category: 'general' }).select().single();
    if (error) { toast.error('Memory save failed'); return; }
    setMemoryItems([data, ...memoryItems]);
    setQuickMemory('');
    toast.success('Memory saved');
  };

  const handleDeleteMemory = async (id: string) => {
    await supabase.from('memory_items').delete().eq('id', id);
    setMemoryItems(memoryItems.filter(m => m.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    const urls = detectUrls(val);
    for (const url of urls) {
      if (!urlPreviews.has(url)) {
        setUrlPreviews(prev => new Map(prev).set(url, { url, status: 'fetching' }));
        scrapeUrl(url)
          .then(data => setUrlPreviews(prev => new Map(prev).set(url, { url, status: 'ready', data })))
          .catch(err => setUrlPreviews(prev => new Map(prev).set(url, { url, status: 'error', error: err.message })));
      }
    }
    // Remove previews for URLs no longer in input
    const current = new Set(urls);
    setUrlPreviews(prev => {
      const next = new Map(prev);
      for (const [k] of next) if (!current.has(k)) next.delete(k);
      return next;
    });
  };

  const removeUrlPreview = (url: string) => {
    setUrlPreviews(prev => { const next = new Map(prev); next.delete(url); return next; });
  };

  const handleDownloadChat = () => {
    if (!messages.length) { toast.error('No messages to download'); return; }
    const chatTitle = chatHistory.find(c => c.id === activeChatId)?.title || 'chat';
    const lines = messages.map(m =>
      `### ${m.role === 'user' ? `**You**` : `**CockRoach**`}\n\n${m.rawText || m.content}`
    ).join('\n\n---\n\n');
    const md = `# ${chatTitle}\n\n_Exported from CockRoach — ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}_\n\n---\n\n${lines}`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${chatTitle.slice(0, 40).replace(/[^a-z0-9]/gi, '-')}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Chat downloaded as .md');
  };

  const handleOpenAsDocument = async (content: string) => {
    setDocumentViewerContent(content);
    if (!currentUser || isTyping || streamingContent) return;

    setIsTyping(true);
    setStreamingContent('');

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const ctxHint = lastUserMsg
      ? `\n\nUser's original query context: "${(lastUserMsg.rawText || lastUserMsg.content).slice(0, 200)}"`
      : '';

    const summaryPrompt =
      `Summarize the following document. Output exactly this format:\n\n**Document Summary:**\n\n**Key Points:**\n- point 1\n- point 2\n- point 3\n\n**Key Insights:**\n[2-3 sentences of high-signal takeaways and trends]\n\nBe concise. No fluff.${ctxHint}\n\n---\nDOCUMENT:\n${content.slice(0, 5500)}`;

    try {
      const fullContent = await streamAzureResponse(
        [
          { role: 'system', content: 'You are a precise document summarizer. Output only the requested format.' },
          { role: 'user', content: summaryPrompt },
        ],
        partial => setStreamingContent(partial)
      );
      setStreamingContent('');

      let msgId: string | undefined;
      if (activeChatId) {
        const { data: inserted } = await supabase
          .from('messages')
          .insert({ chat_id: activeChatId, role: 'assistant', content: fullContent })
          .select().single();
        msgId = inserted?.id;
      }
      msgId = msgId ?? `summary-${Date.now()}`;
      setSummaryMeta(prev => new Map(prev).set(msgId!, content));
      setMessages(prev => [...prev, { id: msgId, role: 'assistant', content: fullContent }]);
    } catch (e: any) {
      toast.error(`Summary failed: ${e.message}`);
    } finally {
      setIsTyping(false);
      setStreamingContent('');
    }
  };

  const handleRegenerateResponse = async () => {
    if (!currentUser || isTyping || streamingContent) return;
    // Find last assistant msg and the user msg before it
    const lastAssistantIdx = [...messages].reverse().findIndex(m => m.role === 'assistant');
    if (lastAssistantIdx === -1) return;
    const assistantMsg = messages[messages.length - 1 - lastAssistantIdx];
    const userMsgIdx = messages.slice(0, messages.length - 1 - lastAssistantIdx).reverse().findIndex(m => m.role === 'user');
    if (userMsgIdx === -1) return;
    const userMsg = messages[messages.length - 2 - lastAssistantIdx - userMsgIdx];
    // Remove last assistant message
    if (assistantMsg.id) await supabase.from('messages').delete().eq('id', assistantMsg.id);
    setMessages(prev => prev.filter((_, i) => i !== messages.length - 1 - lastAssistantIdx));
    setShowAnalysisButton(false);
    // Resend
    await handleSendMessage(userMsg.rawText || userMsg.content);
  };

  const handleEditUserMessage = (msg: { id?: string; content: string; rawText?: string }) => {
    setInput(msg.rawText || msg.content);
    setEditingUserMsgId(msg.id || null);
  };

  const handleRunFullAnalysis = () => {
    setShowAnalysisButton(false);
    const analysisPrompt = `Run a complete Cockroach Intelligence Report on this startup idea. Structure your response with exactly these 10 numbered sections:\n\n1. **Problem & Pain Point Analysis** — who suffers, how badly, why existing solutions fail\n2. **Solution Architecture** — what CockRoach proposes, core features, differentiation\n3. **Market Size (TAM / SAM / SOM)** — quantified estimates with reasoning\n4. **Competitive Landscape** — key players, their weaknesses, your edge\n5. **Business Model & Revenue** — pricing, unit economics, paths to profitability\n6. **Go-to-Market Strategy** — first 100 customers, channels, acquisition cost\n7. **Team & Execution Requirements** — skills needed, hiring sequence, key risks\n8. **Financial Projections & Funding Needs** — 18-month runway estimate, raise size if needed\n9. **USA Grants & Non-Dilutive Funding** — specific SBIR/STTR/grant programs this qualifies for\n10. **CockRoach Verdict** — final score (0–100), pass/fail, top 3 actionable next steps\n\nBe brutally specific. No fluff. Numbers over adjectives.`;
    handleSendMessage(analysisPrompt);
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
        {/* Sidebar Header — brand */}
        <div className="px-5 pt-5 pb-4 border-b border-border/60 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-black tracking-tight leading-none">
              <span className="text-foreground">Cock</span><span className="text-primary">Roach</span>
            </h1>
            <p className="text-[11px] text-muted-foreground/70 italic mt-0.5 font-medium">Not a Unicorn. Better!</p>
          </div>
          <button
            onClick={() => setIsLeftSidebarCollapsed(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all mt-0.5"
          >
            <PanelLeftClose size={15} />
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
                <div
                  key={historyItem.id}
                  className={cn(
                    "w-full flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all group",
                    activeChatId === historyItem.id ? "bg-card/60" : "hover:bg-card/40"
                  )}
                >
                  {renamingChatId === historyItem.id ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameChat(historyItem.id, renameValue);
                          if (e.key === 'Escape') setRenamingChatId(null);
                        }}
                        className="flex-1 min-w-0 bg-background border border-primary/40 rounded px-2 py-0.5 text-[12px] text-foreground focus:outline-none"
                      />
                      <button onClick={() => handleRenameChat(historyItem.id, renameValue)} className="p-0.5 text-primary hover:text-primary/80">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setRenamingChatId(null)} className="p-0.5 text-muted-foreground hover:text-foreground">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { setActiveChatId(historyItem.id); setCurrentPage('chat'); }}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 transition-colors", activeChatId === historyItem.id ? "bg-primary" : "bg-border group-hover:bg-primary/50")} />
                        <span className={cn("truncate text-[13px]", activeChatId === historyItem.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                          {historyItem.title}
                        </span>
                      </button>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => { setRenamingChatId(historyItem.id); setRenameValue(historyItem.title); }}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-all"
                          title="Rename"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteChat(historyItem.id)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
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

      {/* Main Content Area — split when document viewer is open */}
      <main className="flex-1 flex relative bg-background overflow-hidden">
      {/* Chat column */}
      <div className={cn("flex flex-col flex-1 min-w-0 transition-all duration-300", documentViewerContent ? "max-w-[55%]" : "w-full")}>
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
              <div className="relative w-full max-w-sm" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setSearchFocused(false); } }}>
                 <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                 <input
                   ref={searchRef}
                   type="text"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   onFocus={() => setSearchFocused(true)}
                   placeholder="Search chats, messages..."
                   className="w-full bg-surface-mid border border-border rounded-xl pl-9 pr-10 py-1.5 h-9 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:bg-card transition-all"
                 />
                 {!searchQuery && (
                   <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/60 font-mono bg-background border border-border px-1.5 py-0.5 rounded">⌘K</kbd>
                 )}
                 {searchQuery && (
                   <button onClick={() => { setSearchQuery(''); setSearchFocused(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                     <X size={12} />
                   </button>
                 )}
                 {/* Search results dropdown */}
                 <AnimatePresence>
                   {searchFocused && searchQuery.length >= 2 && (searchResults.chats.length > 0 || searchResults.messages.length > 0) && (
                     <motion.div
                       initial={{ opacity: 0, y: -6, scale: 0.98 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: -6, scale: 0.98 }}
                       className="absolute top-full mt-2 left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[420px] overflow-y-auto layaa-scroll"
                     >
                       {searchResults.chats.length > 0 && (
                         <div>
                           <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-1.5">Chats</p>
                           {searchResults.chats.map(chat => (
                             <button key={chat.id} onMouseDown={() => handleSearchSelect(chat.id)}
                               className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                               <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                               <span className="text-[13px] text-foreground truncate">{chat.title}</span>
                             </button>
                           ))}
                         </div>
                       )}
                       {searchResults.messages.length > 0 && (
                         <div className="border-t border-white/5">
                           <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-1.5">Messages</p>
                           {searchResults.messages.map(msg => (
                             <button key={msg.id} onMouseDown={() => handleSearchSelect(msg.chat_id)}
                               className="w-full flex flex-col gap-0.5 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                               <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{msg.chatTitle}</span>
                               <span className="text-[12px] text-muted-foreground truncate">{msg.content.slice(0, 80)}</span>
                             </button>
                           ))}
                         </div>
                       )}
                     </motion.div>
                   )}
                   {searchFocused && searchQuery.length >= 2 && searchResults.chats.length === 0 && searchResults.messages.length === 0 && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       className="absolute top-full mt-2 left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 px-4 py-6 text-center">
                       <p className="text-[12px] text-muted-foreground">No results for "<span className="text-foreground">{searchQuery}</span>"</p>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>
           
           <div className="flex items-center justify-end gap-3 w-1/3">
              {/* Download Chat — only when a chat is active */}
              {activeChatId && currentPage === 'chat' && messages.length > 0 && (
                <button
                  onClick={handleDownloadChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-mid border border-border rounded-full text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all uppercase tracking-widest"
                >
                  <FileDown size={12} />
                  <span>Download</span>
                </button>
              )}

              <div className="flex items-center gap-2 px-3 py-1 bg-surface-mid border border-border rounded-full hover:border-primary-border/40 transition-all cursor-pointer group" onClick={() => setIsBrutalHonesty(!isBrutalHonesty)}>
                 <div className={cn("w-2 h-2 rounded-full transition-all", isBrutalHonesty ? "bg-primary animate-pulse shadow-[0_0_8px_rgba(92,5,5,0.8)]" : "bg-muted-foreground/30")} />
                 <span className={cn("text-[10px] font-bold uppercase tracking-widest", isBrutalHonesty ? "text-primary" : "text-muted-foreground")}>Brutal Honesty</span>
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

        {/* Shared chat received banner */}
        <AnimatePresence>
          {sharedChatBanner && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mx-6 mt-3 flex items-center gap-3 bg-blue-950/40 border border-blue-500/20 rounded-xl px-4 py-2.5">
              <Users size={13} className="text-blue-400 shrink-0" />
              <p className="text-[12px] text-blue-300 flex-1 truncate">{sharedChatBanner}</p>
              <button onClick={() => setSharedChatBanner(null)} className="p-1 text-blue-400/60 hover:text-blue-300"><X size={12} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share link banner */}
        <AnimatePresence>
          {shareLink && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-6 mt-3 flex items-center gap-3 bg-primary-bg border border-primary/20 rounded-xl px-4 py-3"
            >
              <Link size={14} className="text-primary shrink-0" />
              <p className="text-[12px] text-muted-foreground flex-1 font-mono truncate">{shareLink}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Copied!'); }}
                className="text-[10px] font-bold text-primary hover:brightness-110 uppercase tracking-widest shrink-0"
              >
                Copy
              </button>
              <button
                onClick={() => setShareLink(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto layaa-scroll pb-32" ref={chatScrollRef}>
          {currentPage === 'settings' ? (
            <SettingsLLM sessionTokens={sessionTokens} />
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
            <div className="flex flex-col min-h-full">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 px-8">
                  {/* Center Welcome */}
                  <div className="text-center space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 w-full max-w-3xl mx-auto">
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
                <div className="w-full space-y-1 pt-4 pb-2">
                  {messages.map((msg, i) => (
                    <React.Fragment key={msg.id || i}>

                      {msg.role === 'assistant' ? (
                        /* ── ASSISTANT: left-aligned ── */
                        <div
                          className="flex items-start gap-3 py-1 pl-4 pr-8"
                          onMouseEnter={() => setHoveredMsgKey(msg.id || String(i))}
                          onMouseLeave={() => setHoveredMsgKey(null)}
                        >
                          <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-background border border-border overflow-hidden mt-1">
                            <Bot size={13} className="text-primary" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 max-w-[82%]">
                            {summaryMeta.has(msg.id ?? '') && (
                              <div className="flex items-center gap-1.5 mb-1.5 pl-1">
                                <span className="text-[9px] font-bold text-primary/70 uppercase tracking-widest px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full">Document Summary</span>
                              </div>
                            )}
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                              className="bg-card border border-primary/10 rounded-2xl rounded-tl-sm px-4 py-3">
                              <div className="prose-cockroach">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                              {i === messages.length - 1 && showAnalysisButton && !isTyping && !streamingContent && (
                                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 pt-3 border-t border-primary/20">
                                  <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest font-bold">Startup idea detected</p>
                                  <button onClick={handleRunFullAnalysis}
                                    className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 text-primary rounded-xl text-[11px] font-bold tracking-wide transition-all active:scale-[0.98]">
                                    <Lightbulb size={12} /><span>Run Full 10-Section Intelligence Report</span><ChevronRight size={12} className="ml-1 opacity-60" />
                                  </button>
                                </motion.div>
                              )}
                            </motion.div>
                            {/* Action bar — state-based hover */}
                            <div className={cn("flex items-center gap-0.5 mt-1.5 pl-1 transition-opacity duration-150",
                              hoveredMsgKey === (msg.id || String(i)) ? "opacity-100" : "opacity-0 pointer-events-none")}>
                              {([
                                { icon: Copy, title: 'Copy', onClick: () => { navigator.clipboard.writeText(msg.content); toast.success('Copied'); } },
                                { icon: ThumbsUp, title: 'Good', onClick: () => setMessageRatings(r => ({ ...r, [msg.id || String(i)]: 'up' })), active: messageRatings[msg.id || String(i)] === 'up' },
                                { icon: ThumbsDown, title: 'Bad', onClick: () => setMessageRatings(r => ({ ...r, [msg.id || String(i)]: 'down' })), active: messageRatings[msg.id || String(i)] === 'down' },
                                { icon: FileDown, title: 'Open as document', onClick: () => handleOpenAsDocument(msg.content) },
                                { icon: RefreshCw, title: 'Regenerate', onClick: () => i === messages.length - 1 && handleRegenerateResponse() },
                              ] as { icon: any; title: string; onClick: () => void; active?: boolean }[]).map(({ icon: Icon, title, onClick, active }) => (
                                <button key={title} onClick={onClick} title={title}
                                  className={cn("p-1.5 rounded-lg transition-all", active ? "text-primary bg-primary/10" : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/5")}>
                                  <Icon size={13} />
                                </button>
                              ))}
                            </div>
                            {/* Summary action buttons */}
                            {summaryMeta.has(msg.id ?? '') && (
                              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 mt-2 pl-1 flex-wrap">
                                <button
                                  onClick={() => setDocumentViewerContent(summaryMeta.get(msg.id ?? '') ?? '')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/25 hover:bg-primary/20 text-primary rounded-xl text-[11px] font-bold tracking-wide transition-all active:scale-[0.97]">
                                  <FileText size={11} /> View Full Report
                                </button>
                                <button
                                  onClick={() => { setInput('Can you elaborate on the key insights from this document?'); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-mid border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground rounded-xl text-[11px] font-bold tracking-wide transition-all active:scale-[0.97]">
                                  <ChevronRight size={11} /> Ask Follow-up
                                </button>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* ── USER: right-aligned ── */
                        <div
                          className="flex items-start gap-3 justify-end py-1 pr-4 pl-8"
                          onMouseEnter={() => setHoveredMsgKey(msg.id || String(i))}
                          onMouseLeave={() => setHoveredMsgKey(null)}
                        >
                          <div className="flex flex-col items-end min-w-0 max-w-[75%]">
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                              className="bg-surface-mid border border-border/40 rounded-2xl rounded-tr-sm px-4 py-3 text-[14px] text-foreground leading-relaxed">
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            </motion.div>
                            {/* User action bar */}
                            <div className={cn("flex items-center gap-0.5 mt-1.5 pr-1 justify-end transition-opacity duration-150",
                              hoveredMsgKey === (msg.id || String(i)) ? "opacity-100" : "opacity-0 pointer-events-none")}>
                              <button onClick={() => { navigator.clipboard.writeText(msg.rawText || msg.content); toast.success('Copied'); }}
                                title="Copy" className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/5 transition-all"><Copy size={13} /></button>
                              <button onClick={() => handleEditUserMessage(msg)}
                                title="Edit & resend" className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/5 transition-all"><Pencil size={13} /></button>
                            </div>
                          </div>
                          <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-background border border-border overflow-hidden mt-1">
                            {currentUser?.avatar ? <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" /> : <User size={13} />}
                          </div>
                        </div>
                      )}

                    </React.Fragment>
                  ))}

                  {/* Streaming bubble */}
                  {streamingContent && (
                    <div className="flex items-start gap-3 px-4 py-1">
                      <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-background border border-border mt-1">
                        <Bot size={13} className="text-primary" />
                      </div>
                      <div className="flex-1 max-w-[82%] bg-card border border-primary/10 rounded-2xl rounded-tl-sm px-4 py-3 min-w-0">
                        <div className="prose-cockroach">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                            {streamingContent}
                          </ReactMarkdown>
                        </div>
                        <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
                      </div>
                    </div>
                  )}

                  {/* Typing dots — waiting for first chunk */}
                  {isTyping && !streamingContent && (
                    <div className="flex items-start gap-3 px-4 py-1">
                      <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-background border border-border mt-1">
                        <Bot size={13} className="text-primary animate-pulse" />
                      </div>
                      <div className="bg-card border border-primary/10 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
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
                  {/* URL preview cards */}
                  {urlPreviews.size > 0 && (
                    <div className="px-4 pt-3 pb-1 space-y-1.5">
                      <AnimatePresence>
                        {[...urlPreviews.entries()].map(([url, preview]) => (
                          <motion.div
                            key={url}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2.5 bg-surface-mid/70 border border-border/50 rounded-xl px-3 py-2 overflow-hidden"
                          >
                            <Globe
                              size={12}
                              className={cn(
                                'shrink-0 transition-colors',
                                preview.status === 'fetching' && 'text-primary animate-pulse',
                                preview.status === 'ready' && 'text-green-500',
                                preview.status === 'error' && 'text-destructive'
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-foreground truncate leading-tight">
                                {preview.status === 'fetching'
                                  ? 'Fetching content…'
                                  : preview.status === 'ready'
                                  ? preview.data!.title
                                  : `Failed: ${preview.error}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground/70 truncate font-mono">{getUrlDomain(url)}</p>
                            </div>
                            {preview.status === 'ready' && (
                              <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest shrink-0">Extracted</span>
                            )}
                            <button
                              onClick={() => removeUrlPreview(url)}
                              className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
                            >
                              <X size={11} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                  <textarea
                    placeholder="Brief CockRoach..."
                    value={input}
                    onChange={handleInputChange}
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
                         onClick={() => handleSendMessage()}
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
      </div>{/* end chat column */}

      {/* Document Viewer Panel */}
      <AnimatePresence>
        {documentViewerContent && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '45%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="h-full overflow-hidden shrink-0"
          >
            <DocumentViewer content={documentViewerContent} onClose={() => setDocumentViewerContent(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      </main>{/* end main */}

      {/* Right Sidebar - Memory Context Panel */}
      <motion.aside
        initial={false}
        animate={{ width: isRightSidebarCollapsed ? 0 : 280 }}
        className={cn("h-full bg-sidebar border-l border-border flex flex-col transition-all overflow-hidden relative shadow-sm z-30", isRightSidebarCollapsed && "border-none")}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-sidebar/50 shrink-0">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Memory</span>
          </div>
          <button onClick={() => setIsRightSidebarCollapsed(true)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all">
            <PanelRightClose size={16} className="rotate-180" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto layaa-scroll">
          {/* Active Mode */}
          <div className="px-4 pt-4 pb-3 border-b border-border/50">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Active Mode</p>
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl">
              {(() => { const m = APP_MODES.find(m => m.id === activeMode); return m ? <><m.icon size={13} className="text-primary" /><span className="text-[12px] font-bold text-primary">{m.label}</span></> : null; })()}
            </div>
          </div>

          {/* Chat context */}
          {activeChatId && (
            <div className="px-4 pt-4 pb-3 border-b border-border/50">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Current Chat</p>
              <p className="text-[12px] text-foreground font-medium truncate">
                {chatHistory.find(c => c.id === activeChatId)?.title || 'Untitled'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{messages.length} messages</p>
            </div>
          )}

          {/* Memory items */}
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Memory Bank</p>
              <span className="text-[9px] text-muted-foreground/60 font-mono">{memoryItems.length} items</span>
            </div>

            {/* Quick add */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={quickMemory}
                onChange={e => setQuickMemory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuickAddMemory()}
                placeholder="Add memory..."
                className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 transition-all"
              />
              <button onClick={handleQuickAddMemory} disabled={!quickMemory.trim()}
                className="px-2.5 py-1.5 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary rounded-lg text-[11px] font-bold transition-all disabled:opacity-30">
                <Plus size={12} />
              </button>
            </div>

            {memoryItems.length === 0 ? (
              <div className="text-center py-8">
                <Brain size={24} className="text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground/60">No memories yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {memoryItems.slice(0, 20).map(item => (
                  <div key={item.id} className="group flex items-start gap-2 p-2.5 bg-card/40 border border-border/40 rounded-xl hover:border-border transition-colors">
                    <span className="text-[9px] font-bold text-primary/70 uppercase tracking-wider shrink-0 mt-0.5 px-1.5 py-0.5 bg-primary/10 rounded">{item.category}</span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed flex-1 min-w-0">{item.content}</p>
                    <button onClick={() => handleDeleteMemory(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground/40 hover:text-destructive transition-all shrink-0">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
