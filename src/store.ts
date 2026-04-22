import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KBToggles, MemoryItem, DEFAULT_KB_TOGGLES } from './lib/system-prompt-builder';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isInitial?: boolean;
};

export type PricingRates = {
  inputPerMillion: number;
  outputPerMillion: number;
  isCustom: boolean;
  lastFetched?: string;
};

type AppState = {
  currentUser: UserProfile | null;
  profiles: UserProfile[];
  azureConfig: {
    apiKey: string;
    endpoint: string;
    deployment: string;
    model: string;
    version: string;
  };
  kbToggles: KBToggles;
  memoryItems: MemoryItem[];
  systemPrompt: string;
  pricingRates: PricingRates;
  setAzureConfig: (config: any) => void;
  setCurrentUser: (user: UserProfile | null) => void;
  updateCurrentUser: (userData: Partial<UserProfile>) => void;
  addProfile: (profile: UserProfile) => void;
  setKBToggles: (toggles: Partial<KBToggles>) => void;
  setMemoryItems: (items: MemoryItem[]) => void;
  setSystemPrompt: (prompt: string) => void;
  setPricingRates: (rates: Partial<PricingRates>) => void;
};

const INITIAL_PROFILES: UserProfile[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'DagnA',
    email: 'angad@email.com',
    avatar: '/profiles/DagnA.png',
    isInitial: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Subi',
    email: 'shbhsingh25@gmail.com',
    avatar: '/profiles/Subi.png',
    isInitial: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'ManU',
    email: 'abhi.prabal@gmail.com',
    avatar: '/profiles/ManU.png',
    isInitial: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Gill Saab',
    email: 'singhgillaakriti@gmail.com',
    avatar: '/profiles/Gill.png',
    isInitial: true,
  },
];

// Display-only defaults. The real Azure credentials live in server env vars
// (AZURE_OPENAI_*) and are used only by the /api/chat proxy; the client never
// sees the key.
const DEFAULT_AZURE_CONFIG = {
  apiKey: '',
  endpoint: '',
  deployment: '',
  model: '',
  version: '',
};

const DEFAULT_PRICING: PricingRates = {
  inputPerMillion: 0,
  outputPerMillion: 0,
  isCustom: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      profiles: INITIAL_PROFILES,
      azureConfig: DEFAULT_AZURE_CONFIG,
      kbToggles: DEFAULT_KB_TOGGLES,
      memoryItems: [],
      systemPrompt: '',
      pricingRates: DEFAULT_PRICING,
      setAzureConfig: (config) => set((state) => ({ azureConfig: { ...state.azureConfig, ...config } })),
      setCurrentUser: (user) => set({ currentUser: user }),
      updateCurrentUser: (userData) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...userData } : null,
        profiles: state.profiles.map(p => p.id === state.currentUser?.id ? { ...p, ...userData } : p)
      })),
      addProfile: (profile) => set((state) => ({
        profiles: [...state.profiles, profile]
      })),
      setKBToggles: (toggles) => set((state) => ({
        kbToggles: { ...state.kbToggles, ...toggles }
      })),
      setMemoryItems: (items) => set({ memoryItems: items }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setPricingRates: (rates) => set((state) => ({
        pricingRates: { ...state.pricingRates, ...rates }
      })),
    }),
    {
      name: 'cockroach-storage',
      version: 6,
      migrate: (persistedState: any, version: number) => {
        if (version < 4) {
          return {
            currentUser: null,
            profiles: INITIAL_PROFILES,
            azureConfig: DEFAULT_AZURE_CONFIG,
            kbToggles: DEFAULT_KB_TOGGLES,
            memoryItems: [],
            systemPrompt: '',
            pricingRates: DEFAULT_PRICING,
          };
        }
        if (version < 5) {
          persistedState = { ...persistedState, pricingRates: DEFAULT_PRICING };
        }
        // v5 → v6: sync the 4 default profiles (DagnA/Subi/ManU/Gill) into
        // persisted state. Refreshes avatar/name/email on existing defaults,
        // appends missing ones. User-created profiles (non-default ids) are
        // preserved untouched. Idempotent.
        if (version < 6) {
          const existing: UserProfile[] = persistedState.profiles ?? [];
          const defaultsById = new Map(INITIAL_PROFILES.map(p => [p.id, p]));
          const merged = existing.map(p => defaultsById.has(p.id) ? { ...p, ...defaultsById.get(p.id)! } : p);
          const existingIds = new Set(existing.map(p => p.id));
          const appended = INITIAL_PROFILES.filter(p => !existingIds.has(p.id));
          persistedState = { ...persistedState, profiles: [...merged, ...appended] };
        }
        return persistedState;
      }
    }
  )
);
