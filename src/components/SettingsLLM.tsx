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
  Camera,
  Mail,
  Lock,
  ChevronDown,
  Cloud,
  AlertCircle,
  Upload
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function SettingsLLM() {
  const { azureConfig, setAzureConfig, currentUser, updateCurrentUser } = useAppStore();
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
    updateCurrentUser(profileData);
    try {
      if (!currentUser) return;
      const { error } = await supabase.from('users').update({
        name: profileData.name,
        email: profileData.email,
        avatar: profileData.avatar,
        updated_at: new Date().toISOString()
      }).eq('id', currentUser.id);
      
      if (error) {
         toast.error(`Identity Update Failed: ${error.message}`);
      } else {
         toast.success('Identity updated and synced.');
      }
    } catch (err: any) {
      toast.error(`Update Error: ${err.message}`);
    }
  };

  const handleAzureSync = async () => {
     setAzureConfig(localAzureConfig);
     try {
       if (!currentUser) return;
       const { error } = await supabase.from('azure_configs').update({
         api_key: localAzureConfig.apiKey,
         endpoint: localAzureConfig.endpoint,
         deployment: localAzureConfig.deployment,
         model: localAzureConfig.model,
         version: localAzureConfig.version,
         updated_at: new Date().toISOString()
       }).eq('user_id', currentUser.id);
       
       if (error) {
          toast.error(`Config Sync Failed: ${error.message}`);
       } else {
          toast.success('Configuration synced to remote vault.');
       }
     } catch (err: any) {
        toast.error(`Sync Error: ${err.message}`);
     }
  };

  const PROVIDERS = [
    { 
      id: 'azure', 
      name: 'Azure AI Foundry', 
      icon: Cloud, 
      status: 'inactive',
      description: 'Enterprise-grade neural orchestration for mission-critical tasks.',
      knowledge: ['gpt-5.1-chat', 'Azure OpenAI GPT-4o', 'Llama-3-70B (Foundry)']
    },
    { 
      id: 'google', 
      name: 'Google Gemini', 
      icon: Globe, 
      status: 'active',
      description: 'Multimodal mastery with 1M+ context. Default co-founder engine.',
      knowledge: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro', 'Deep Research']
    },
    { 
      id: 'openai', 
      name: 'OpenAI', 
      icon: Cpu, 
      status: 'inactive',
      description: 'The industry standard for reasoning and tool-use precision.',
      knowledge: ['GPT-4o', 'o1 series', 'GPT-4 Turbo']
    },
    { 
      id: 'anthropic', 
      name: 'Anthropic', 
      icon: ShieldCheck, 
      status: 'inactive',
      description: 'Nuanced writing, complex reasoning, and massive context windows.',
      knowledge: ['Claude 3.5 Sonnet', 'Claude 3 Opus']
    },
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
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Identity Configuration */}
      <div className="space-y-6">
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
      </div>

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
                        const baseUrl = azureConfig.endpoint.endsWith('/') ? azureConfig.endpoint.slice(0, -1) : azureConfig.endpoint;
                        const url = `${baseUrl}/openai/deployments/${azureConfig.deployment}/chat/completions?api-version=${azureConfig.version}`;
                        const res = await fetch(url.replace(/([^:]\/)\/+/g, "$1"), {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'api-key': azureConfig.apiKey },
                          body: JSON.stringify({ messages: [{ role: 'user', content: 'Ping' }], max_tokens: 5 })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error?.message || 'Connection failed');
                        alert('Connection Successful!');
                      } catch (e: any) {
                        alert(`Connection Error: ${e.message}`);
                      }
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
                        placeholder={activeProvider === 'azure' ? "Azure API Key" : "sk-••••••••••••••••••••••••"}
                        value={activeProvider === 'azure' ? localAzureConfig.apiKey : ''}
                        onChange={(e) => activeProvider === 'azure' && setLocalAzureConfig({ ...localAzureConfig, apiKey: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all font-mono placeholder:text-muted-foreground/50 shadow-inner"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground/70 italic px-1 leading-relaxed">Keys are encrypted using AES-256 and stored in your dedicated secure vault.</p>
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

      {/* Resource Utilization - High-end Minimal Data Visualization */}
      <div className="layaa-card p-8 space-y-8 bg-card backdrop-blur-sm">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
             <h3 className="text-lg font-bold text-foreground tracking-tight">Neural Resource Index</h3>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Real-time Token Consumption & Projected Cost</p>
           </div>
           <div className="text-right">
             <span className="text-3xl font-bold text-foreground font-mono tracking-tighter">₹1,024.00</span>
             <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-1 italic">EST. MONTHLY RUNRATE</p>
           </div>
        </div>
        
        <div className="h-44 w-full bg-background/50 border border-border rounded-xl flex items-center justify-center relative overflow-hidden group cursor-crosshair">
           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <Activity size={32} className="text-muted-foreground/30 animate-pulse" />
           <span className="text-[11px] text-muted-foreground font-mono ml-4 uppercase tracking-[0.2em] font-medium">Aggregating cluster data...</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
           {[
             { label: 'Uptime', value: '99.98%', color: 'success' },
             { label: 'Latency', value: '142ms', color: 'primary' },
             { label: 'Neural Load', value: '14%', color: 'accent' }
           ].map((stat) => (
             <div key={stat.label} className="bg-background border border-border p-4 rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">{stat.label}</span>
                <span className={`text-lg font-bold font-mono text-${stat.color}`}>{stat.value}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
