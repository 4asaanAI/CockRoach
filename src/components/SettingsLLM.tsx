import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  Key,
  Cpu,
  Globe,
  ShieldCheck,
  Save,
  Activity,
  User,
  Mail,
  Lock,
  ChevronDown,
  Cloud,
  AlertCircle,
  Upload,
  Brain,
  RefreshCw,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import SettingsAgentBrain from './SettingsAgentBrain';

// ── Azure Retail Prices API ───────────────────────────────────────────────────
type FetchStatus = 'idle' | 'fetching' | 'found' | 'not-found' | 'error';

async function fetchAzureOpenAIPricing(
  modelName: string
): Promise<{ input: number; output: number; status: FetchStatus }> {
  try {
    const res = await fetch(`/api/pricing?model=${encodeURIComponent(modelName)}`, {
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data as { input: number; output: number; status: FetchStatus };
  } catch {
    return { input: 0, output: 0, status: 'error' };
  }
}

const SETTINGS_TABS = [
  { id: 'identity', label: 'Identity' },
  { id: 'llm', label: 'LLM Config' },
  { id: 'brain', label: 'Agent Brain', icon: Brain },
];

export default function SettingsLLM({ sessionTokens }: { sessionTokens?: { prompt: number; completion: number } }) {
  const [activeTab, setActiveTab] = React.useState<'identity' | 'llm' | 'brain'>('identity');
  const { azureConfig, setAzureConfig, currentUser, updateCurrentUser, pricingRates, setPricingRates } = useAppStore();
  const [connectionStatus, setConnectionStatus] = React.useState<'unknown' | 'ok' | 'error'>('unknown');

  // ── Pricing state ──────────────────────────────────────────────────────────
  const [fetchStatus, setFetchStatus] = React.useState<FetchStatus>('idle');
  const [editingRates, setEditingRates] = React.useState(false);
  const [draftInput,  setDraftInput]  = React.useState('');
  const [draftOutput, setDraftOutput] = React.useState('');

  const effectiveInput  = pricingRates.inputPerMillion;
  const effectiveOutput = pricingRates.outputPerMillion;

  const triggerPricingFetch = React.useCallback(async (model: string) => {
    setFetchStatus('fetching');
    const result = await fetchAzureOpenAIPricing(model);
    setFetchStatus(result.status);
    if (result.status === 'found') {
      setPricingRates({
        inputPerMillion:  result.input,
        outputPerMillion: result.output,
        isCustom: false,
        lastFetched: new Date().toISOString(),
      });
      toast.success(`Live pricing loaded for ${model}`);
    } else if (result.status === 'not-found') {
      toast.info(`${model} not in Azure pricing catalog — set custom rates below`);
    } else {
      toast.error('Pricing fetch failed — check connection');
    }
  }, [setPricingRates]);

  // Auto-fetch when LLM tab opens or model changes
  React.useEffect(() => {
    if (activeTab !== 'llm') return;
    if (pricingRates.isCustom) return;
    triggerPricingFetch(azureConfig.model || 'gpt-5.3-chat');
  }, [activeTab, azureConfig.model]);

  const saveCustomRates = () => {
    const inp = parseFloat(draftInput);
    const out = parseFloat(draftOutput);
    if (isNaN(inp) || isNaN(out) || inp < 0 || out < 0) {
      toast.error('Enter valid non-negative numbers');
      return;
    }
    setPricingRates({ inputPerMillion: inp, outputPerMillion: out, isCustom: true, lastFetched: new Date().toISOString() });
    setEditingRates(false);
    toast.success('Custom rates saved');
  };

  const startEditing = () => {
    setDraftInput(effectiveInput ? effectiveInput.toFixed(2) : '');
    setDraftOutput(effectiveOutput ? effectiveOutput.toFixed(2) : '');
    setEditingRates(true);
  };

  const sessionCost = sessionTokens
    ? ((sessionTokens.prompt / 1_000_000) * effectiveInput + (sessionTokens.completion / 1_000_000) * effectiveOutput)
    : 0;
  // ── End pricing state ──────────────────────────────────────────────────────

  const [personalization, setPersonalization] = React.useState({
    tone: 'Professional', warm: 'Default', enthusiastic: 'Default',
    headers_lists: 'Default', emoji: 'Default',
    custom_instructions: '', nickname: '', occupation: '', location: '',
    interests: '', communication_style: 'Direct',
  });
  const [personalLoaded, setPersonalLoaded] = React.useState(false);

  // Load personalization from Supabase on mount
  React.useEffect(() => {
    if (!currentUser || personalLoaded) return;
    supabase.from('user_personalization').select('*').eq('user_id', currentUser.id).single()
      .then(({ data }) => {
        if (data) setPersonalization(p => ({ ...p, ...data }));
        setPersonalLoaded(true);
      });
  }, [currentUser?.id]);

  const handlePersonalizationSave = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('user_personalization').upsert({
      user_id: currentUser.id, ...personalization, updated_at: new Date().toISOString()
    });
    if (error) toast.error(`Personalization save failed: ${error.message}`);
    else toast.success('Personalization saved');
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeProvider, setActiveProvider] = React.useState<string | null>('azure');
  const [profileData, setProfileData] = React.useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    avatar: currentUser?.avatar || '',
    password: ''
  });

  const [localAzureConfig, setLocalAzureConfig] = React.useState(azureConfig);

  React.useEffect(() => {
    setLocalAzureConfig(azureConfig);
  }, [azureConfig]);

  const handleProfileSave = async () => {
    updateCurrentUser({ name: profileData.name, email: profileData.email, avatar: profileData.avatar });
    try {
      if (!currentUser) return;
      const updateData: Record<string, any> = {
        name: profileData.name,
        email: profileData.email,
        avatar: profileData.avatar,
        updated_at: new Date().toISOString(),
      };
      if (profileData.password) {
        updateData.password = profileData.password;
      }
      const { error } = await supabase.from('users').update(updateData).eq('id', currentUser.id);

      if (error) {
         toast.error(`Identity Update Failed: ${error.message}`);
      } else {
         toast.success('Identity updated and synced.');
         if (profileData.password) setProfileData(d => ({ ...d, password: '' }));
      }
    } catch (err: any) {
      toast.error(`Update Error: ${err.message}`);
    }
  };

  const handleAzureSync = async () => {
     setAzureConfig(localAzureConfig);
     try {
       if (!currentUser) return;
       // api_key is managed server-side and always null here
       const { error } = await supabase.from('azure_configs').upsert({
         user_id: currentUser.id,
         api_key: null,
         endpoint: localAzureConfig.endpoint,
         deployment: localAzureConfig.deployment,
         model: localAzureConfig.model,
         version: localAzureConfig.version,
         updated_at: new Date().toISOString(),
       }, { onConflict: 'user_id' });

       if (error) {
          toast.error(`Config Sync Failed: ${error.message}`);
       } else {
          toast.success('Configuration saved.');
       }
     } catch (err: any) {
        toast.error(`Sync Error: ${err.message}`);
     }
  };

  const PROVIDERS = [
    { id: 'azure', name: 'Azure AI Foundry', icon: Cloud, status: connectionStatus === 'ok' ? 'active' : connectionStatus === 'error' ? 'error' : 'active', description: 'Enterprise-grade neural orchestration — active provider.', knowledge: [azureConfig.model || 'gpt-5.3-chat', `Deployment: ${azureConfig.deployment}`, 'Azure OpenAI Service'] },
    { id: 'google', name: 'Google Gemini', icon: Globe, status: 'inactive', description: 'Multimodal mastery with 1M+ context.', knowledge: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro'] },
    { id: 'openai', name: 'OpenAI', icon: Cpu, status: 'inactive', description: 'Industry standard for reasoning and tool-use.', knowledge: ['GPT-4o', 'o1 series'] },
    { id: 'anthropic', name: 'Anthropic', icon: ShieldCheck, status: 'inactive', description: 'Nuanced writing and massive context windows.', knowledge: ['Claude 3.5 Sonnet', 'Claude 3 Opus'] },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-border">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {tab.icon && <tab.icon size={12} />}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'brain' && <SettingsAgentBrain />}

      {activeTab !== 'brain' && (
      <div className="space-y-10">

      {/* Identity Configuration */}
      {activeTab === 'identity' && <div className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Identity Configuration</h2>
          <p className="text-muted-foreground text-[13px] leading-relaxed max-w-2xl">
            Manage your personal intelligence protocol identity and access credentials.
          </p>
        </div>

        <div className="layaa-card bg-card/50 backdrop-blur-sm shadow-xl ring-1 ring-primary/5 p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
               <div 
                 className="w-24 h-24 rounded-2xl bg-surface-mid border border-border flex items-center justify-center text-muted-foreground relative group overflow-hidden shadow-sm cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}
               >
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} />
                  )}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={20} className="text-foreground" />
                  </div>
               </div>
               <input 
                 type="file" 
                 ref={fileInputRef}
                 className="hidden"
                 accept="image/*"
                 onChange={handleImageUpload}
               />
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Display Name</label>
                 <div className="relative">
                   <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <input 
                     type="text" 
                     value={profileData.name}
                     onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                     className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                   />
                 </div>
               </div>
               
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Email Protocol</label>
                 <div className="relative">
                   <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <input 
                     type="email" 
                     value={profileData.email}
                     onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                     className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                   />
                 </div>
               </div>
               
               <div className="space-y-2 md:col-span-2">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Access Passcode</label>
                 <div className="relative">
                   <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <input 
                     type="password" 
                     placeholder="Change Password..."
                     value={profileData.password}
                     onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                     className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                   />
                 </div>
               </div>
            </div>
          </div>
          <div className="pt-6 border-t border-border mt-6 flex justify-end">
            <button 
              onClick={handleProfileSave}
              className="px-8 py-2.5 bg-primary hover:brightness-110 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-primary/20 uppercase tracking-widest flex items-center gap-2 active:scale-95"
            >
              <Save size={14} />
              <span>Update Identity</span>
            </button>
          </div>
        </div>
      </div>}

      {/* ── Personalization (only in Identity tab) ── */}
      {activeTab === 'identity' && <div className="layaa-card bg-card/50 backdrop-blur-sm shadow-xl ring-1 ring-primary/5 p-8 space-y-8">
        <div>
          <h3 className="text-lg font-bold text-foreground">Personalization</h3>
          <div className="h-px bg-border mt-3 mb-6" />
        </div>

        {/* Response Style */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Base style and tone</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Sets how CockRoach responds to you. Doesn't impact capabilities.</p>
            </div>
            <select value={personalization.tone} onChange={e => setPersonalization(p => ({ ...p, tone: e.target.value }))}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50 min-w-[140px]">
              {['Professional', 'Direct', 'Casual', 'Socratic', 'Mentoring', 'Blunt / No-fluff'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="h-px bg-border/60" />
          <p className="text-[13px] font-semibold text-foreground">Characteristics</p>
          <p className="text-[11px] text-muted-foreground -mt-3">Additional customizations layered on top of your base tone.</p>

          {[
            { label: 'Warmth', key: 'warm', options: ['Default', 'Low', 'High'] },
            { label: 'Enthusiasm', key: 'enthusiastic', options: ['Default', 'Low', 'High'] },
            { label: 'Headers & Lists', key: 'headers_lists', options: ['Default', 'Always', 'Never'] },
            { label: 'Emoji', key: 'emoji', options: ['Default', 'Never', 'Occasional', 'Liberal'] },
            { label: 'Communication Style', key: 'communication_style', options: ['Direct', 'Narrative', 'Bullet-first', 'Socratic'] },
          ].map(({ label, key, options }) => (
            <div key={key} className="flex items-center justify-between">
              <p className="text-[13px] text-foreground">{label}</p>
              <select value={(personalization as any)[key]} onChange={e => setPersonalization(p => ({ ...p, [key]: e.target.value }))}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50 min-w-[140px]">
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

          <div className="h-px bg-border/60" />
          <div>
            <p className="text-[13px] font-semibold text-foreground mb-1.5">Custom instructions</p>
            <textarea
              value={personalization.custom_instructions}
              onChange={e => setPersonalization(p => ({ ...p, custom_instructions: e.target.value }))}
              placeholder="e.g. Always be concise. Use startup terminology. Reference real companies when possible."
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 resize-none transition-all"
            />
          </div>
        </div>

        {/* About You */}
        <div className="space-y-5">
          <div className="h-px bg-border" />
          <p className="text-[15px] font-bold text-foreground">About You</p>
          <div className="h-px bg-border/60" />

          {[
            { label: 'Nickname', key: 'nickname', placeholder: 'What should CockRoach call you?' },
            { label: 'Occupation', key: 'occupation', placeholder: 'Founder, Investor, Engineer...' },
            { label: 'Location (City, State)', key: 'location', placeholder: 'e.g. San Francisco, CA' },
            { label: 'Interests / Domains', key: 'interests', placeholder: 'e.g. SaaS, AI, HealthTech, Defense...' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <p className="text-[13px] font-semibold text-foreground mb-1.5">{label}</p>
              <input type="text" value={(personalization as any)[key]} placeholder={placeholder}
                onChange={e => setPersonalization(p => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handlePersonalizationSave}
            className="px-8 py-2.5 bg-primary hover:brightness-110 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-primary/20 uppercase tracking-widest flex items-center gap-2 active:scale-95">
            <Save size={14} /><span>Save Personalization</span>
          </button>
        </div>
      </div>}

      {activeTab === 'llm' && <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Neural Intelligence Suite</h2>
        <p className="text-muted-foreground text-[13px] leading-relaxed max-w-2xl">
          Calibrate your co-founder's strategic engines. CockRoach utilizes a provider-agnostic 
          abstraction layer to ensure operational continuity under any conditions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map((provider) => (
          <button 
            key={provider.id}
            onClick={() => setActiveProvider(activeProvider === provider.id ? null : provider.id)}
            className={cn(
              "p-5 bg-card border border-border rounded-xl flex flex-col items-start gap-4 transition-all text-left relative overflow-hidden group layaa-card-interactive",
              activeProvider === provider.id && "border-primary/40 bg-primary-bg shadow-sm ring-1 ring-primary/10"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
              provider.status === 'active' ? "bg-primary text-white" : "bg-background text-muted-foreground"
            )}>
              <provider.icon size={20} strokeWidth={1.5} />
            </div>
            
            <div className="space-y-1">
              <span className="text-sm font-bold text-foreground">{provider.name}</span>
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", provider.status === 'active' ? "bg-success pulse" : "bg-muted-foreground/30")} />
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", provider.status === 'active' ? "text-success" : "text-muted-foreground")}>
                  {provider.status === 'active' ? 'Neural Link Established' : 'Link Offline'}
                </span>
              </div>
            </div>

            <ChevronDown 
              size={16} 
              className={cn(
                "absolute right-6 top-6 text-muted-foreground transition-transform",
                activeProvider === provider.id && "rotate-180 text-primary"
              )} 
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activeProvider && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="layaa-card bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl ring-1 ring-primary/5"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between border-b border-border pb-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Configure {activeProvider.toUpperCase()}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Strategic Identity & Key Exchange</p>
                </div>
                <button 
                  onClick={async () => {
                    if (activeProvider === 'azure') {
                      try {
                        toast.loading('Testing connection...', { id: 'conn-test' });
                        const res = await fetch('/api/chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
                        });
                        if (!res.ok) {
                          let message = res.statusText;
                          try { const err = await res.json(); message = err?.error ?? message; } catch { /* non-json */ }
                          throw new Error(message);
                        }
                        // Drain the stream briefly to confirm the upstream is alive
                        const reader = res.body?.getReader();
                        if (reader) { await reader.read(); await reader.cancel(); }
                        setConnectionStatus('ok');
                        toast.success('Azure connection verified ✓', { id: 'conn-test' });
                      } catch (e: any) {
                        setConnectionStatus('error');
                        toast.error(`Connection failed: ${e.message}`, { id: 'conn-test' });
                      }
                    } else {
                      toast.info(`${activeProvider} integration not yet configured.`);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-full text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all hover:border-primary-border shadow-sm">
                  <Activity size={14} className="text-primary" />
                  <span>TEST CONNECTION</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">API Secret Key</label>
                    <div className="relative group">
                      <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="password"
                        placeholder="Managed server-side"
                        value=""
                        readOnly
                        disabled
                        className="w-full bg-background/40 border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-muted-foreground focus:outline-none transition-all font-mono placeholder:text-muted-foreground/50 shadow-inner cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground/70 italic px-1 leading-relaxed">Credentials live in the server environment and are never exposed to the browser. The /api/chat proxy adds the key per request.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">
                      {activeProvider === 'azure' ? 'Resource Endpoint' : 'Base URL Override'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={activeProvider === 'azure' ? "https://{resource}.openai.azure.com/" : "https://api.openai.com/v1"}
                      value={activeProvider === 'azure' ? localAzureConfig.endpoint : ''}
                      onChange={(e) => activeProvider === 'azure' && setLocalAzureConfig({ ...localAzureConfig, endpoint: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all font-mono placeholder:text-muted-foreground/50 shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {activeProvider === 'azure' && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Deployment Name</label>
                       <input 
                         type="text" 
                         placeholder="Azure Deployment ID"
                         value={localAzureConfig.deployment}
                         onChange={(e) => setLocalAzureConfig({ ...localAzureConfig, deployment: e.target.value })}
                         className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all font-mono shadow-inner"
                       />
                    </div>
                  )}

                  <div className="p-5 bg-background border border-border rounded-2xl shadow-inner space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Azure Infrastructure</span>
                    </div>
                    <div className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                       Your configured endpoint provides direct responses over Azure infrastructure. <br/><br/>
                       Model mapping is handled via your explicit deployment ID configuration.
                    </div>
                  </div>

                  {activeProvider === 'anthropic' && (
                    <div className="p-4 bg-warning/5 border border-warning/20 rounded-2xl flex items-start gap-3 animate-in fade-in duration-500">
                      <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-warning uppercase tracking-widest leading-tight">Key Required</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          Your profile currently lacks an Anthropic key. CockRoach will default to Google Gemini to maintain operational integrity.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-5 bg-background border border-border rounded-2xl mt-4 shadow-inner space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Telemetry Metrics</span>
                      <span className="text-[9px] text-muted-foreground uppercase italic font-bold">Foundry Estimates</span>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground">Prompt Density</span>
                          <span className="text-foreground font-bold font-mono">1M : $0.15</span>
                       </div>
                       <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground">Response Power</span>
                          <span className="text-foreground font-bold font-mono">1M : $0.60</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border flex justify-end gap-3">
                 <button className="px-6 py-2.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest">
                  Withdraw Changes
                 </button>
                 <button 
                  onClick={handleAzureSync}
                  className="px-8 py-2.5 bg-primary hover:brightness-110 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-primary/20 uppercase tracking-widest flex items-center gap-2 active:scale-95">
                  <Save size={14} />
                  <span>Sync Configuration</span>
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Token Usage + Pricing */}
      <div className="layaa-card p-8 space-y-6 bg-card backdrop-blur-sm">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground tracking-tight">Session Token Usage</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Live Consumption · {azureConfig.model || 'GPT-5.3'} · Estimated Cost (USD)
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-3xl font-bold text-foreground font-mono tracking-tighter">
              {(effectiveInput || effectiveOutput) ? `$${sessionCost.toFixed(4)}` : '—'}
            </span>
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-1 italic">Session Cost (USD)</p>
          </div>
        </div>

        {/* Token stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Input Tokens',
              value: (sessionTokens?.prompt || 0).toLocaleString(),
              sub: effectiveInput
                ? `$${(((sessionTokens?.prompt || 0) / 1_000_000) * effectiveInput).toFixed(4)}`
                : '—',
            },
            {
              label: 'Output Tokens',
              value: (sessionTokens?.completion || 0).toLocaleString(),
              sub: effectiveOutput
                ? `$${(((sessionTokens?.completion || 0) / 1_000_000) * effectiveOutput).toFixed(4)}`
                : '—',
            },
            {
              label: 'Total Tokens',
              value: ((sessionTokens?.prompt || 0) + (sessionTokens?.completion || 0)).toLocaleString(),
              sub: (effectiveInput || effectiveOutput)
                ? `$${effectiveInput.toFixed(2)}/1M in · $${effectiveOutput.toFixed(2)}/1M out`
                : 'Set rates below',
            },
          ].map(stat => (
            <div key={stat.label} className="bg-background border border-border p-4 rounded-xl">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">{stat.label}</span>
              <span className="text-xl font-bold font-mono text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground/60 font-mono block mt-0.5">{stat.sub}</span>
            </div>
          ))}
        </div>

        {/* Pricing rates panel */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          {/* Pricing header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">Pricing Rates</span>
              {/* Source badge */}
              {fetchStatus === 'fetching' && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded-full animate-pulse">
                  <RefreshCw size={9} className="animate-spin" /> Fetching…
                </span>
              )}
              {fetchStatus === 'found' && !pricingRates.isCustom && (
                <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest px-2 py-0.5 bg-green-500/10 rounded-full">
                  ● Live from Azure
                </span>
              )}
              {pricingRates.isCustom && (
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded-full">
                  ● Custom
                </span>
              )}
              {fetchStatus === 'not-found' && !pricingRates.isCustom && (
                <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest px-2 py-0.5 bg-yellow-500/10 rounded-full">
                  ● Not in catalog
                </span>
              )}
              {fetchStatus === 'error' && (
                <span className="text-[9px] font-bold text-destructive uppercase tracking-widest px-2 py-0.5 bg-destructive/10 rounded-full">
                  ● Fetch failed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {pricingRates.lastFetched && !pricingRates.isCustom && (
                <span className="text-[9px] text-muted-foreground/50 font-mono hidden md:block">
                  Updated {new Date(pricingRates.lastFetched).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => triggerPricingFetch(azureConfig.model || 'gpt-5.3-chat')}
                disabled={fetchStatus === 'fetching'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-mid border border-border hover:border-primary/40 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all disabled:opacity-40 uppercase tracking-widest"
              >
                <RefreshCw size={10} className={fetchStatus === 'fetching' ? 'animate-spin' : ''} />
                Refresh
              </button>
              {!editingRates ? (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 hover:bg-primary/20 rounded-lg text-[10px] font-bold text-primary transition-all uppercase tracking-widest"
                >
                  <Pencil size={10} /> Custom
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={saveCustomRates}
                    className="p-1.5 bg-primary/10 border border-primary/30 hover:bg-primary/20 rounded-lg text-primary transition-all">
                    <Check size={12} />
                  </button>
                  <button onClick={() => setEditingRates(false)}
                    className="p-1.5 bg-surface-mid border border-border hover:border-border/80 rounded-lg text-muted-foreground transition-all">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rate fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border/40">
            {[
              { label: 'Input (Prompt)', key: 'input' as const, value: effectiveInput, draft: draftInput, setDraft: setDraftInput },
              { label: 'Output (Completion)', key: 'output' as const, value: effectiveOutput, draft: draftOutput, setDraft: setDraftOutput },
            ].map(({ label, value, draft, setDraft }) => (
              <div key={label} className="px-5 py-4">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
                {editingRates ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[13px]">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-background border border-primary/40 rounded-lg px-3 py-1.5 text-[13px] font-mono text-foreground focus:outline-none focus:border-primary/70 transition-all"
                    />
                    <span className="text-muted-foreground text-[11px] shrink-0">/ 1M tokens</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[22px] font-bold font-mono text-foreground">
                      {value ? `$${value.toFixed(2)}` : '—'}
                    </span>
                    {value > 0 && <span className="text-[10px] text-muted-foreground/60">per 1M tokens</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="px-5 py-3 bg-background/40 border-t border-border/40">
            {fetchStatus === 'not-found' && !pricingRates.isCustom ? (
              <p className="text-[10px] text-yellow-500/80 leading-relaxed">
                <strong>{azureConfig.model}</strong> is not listed in the Azure Retail Prices catalog (preview or enterprise deployment). Click <strong>Custom</strong> to enter your contracted rates manually.
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Rates are queried from the <span className="font-mono text-foreground/70">prices.azure.com</span> public API for <strong>{azureConfig.model}</strong>. Actual billing depends on your Azure subscription tier and commitment discounts. Token counts reset on page refresh.
              </p>
            )}
          </div>
        </div>
      </div>
      </div>}

      </div>)}
    </div>
  );
}
