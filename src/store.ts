import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KBToggles, MemoryItem } from './lib/system-prompt-builder';
import { DEFAULT_KB_TOGGLES } from './lib/system-prompt-builder';

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

export type AzureConfigView = {
  apiKey: string;    // always '' — credentials live server-side
  endpoint: string;
  deployment: string;
  model: string;
  version: string;
};

type AppState = {
  // Session / UI state (persisted)
  currentUser: UserProfile | null;
  profiles: UserProfile[];
  pricingRates: PricingRates;

  // DB-backed state (NOT persisted — authoritative copy lives in Supabase,
  // these fields are just an in-memory mirror hydrated on user sync).
  azureConfig: AzureConfigView;
  kbToggles: KBToggles;
  memoryItems: MemoryItem[];
  systemPrompt: string;

  setAzureConfig: (config: Partial<AzureConfigView>) => void;
  setCurrentUser: (user: UserProfile | null) => void;
  updateCurrentUser: (userData: Partial<UserProfile>) => void;
  addProfile: (profile: UserProfile) => void;
  setProfiles: (profiles: UserProfile[]) => void;
  setKBToggles: (toggles: Partial<KBToggles>) => void;
  setMemoryItems: (items: MemoryItem[]) => void;
  setSystemPrompt: (prompt: string) => void;
  setPricingRates: (rates: Partial<PricingRates>) => void;
};

export const INITIAL_PROFILES: UserProfile[] = [
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

const DEFAULT_AZURE_CONFIG: AzureConfigView = {
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
      pricingRates: DEFAULT_PRICING,
      azureConfig: DEFAULT_AZURE_CONFIG,
      kbToggles: DEFAULT_KB_TOGGLES,
      memoryItems: [],
      systemPrompt: '',
      setAzureConfig: (config) => set((state) => ({ azureConfig: { ...state.azureConfig, ...config } })),
      setCurrentUser: (user) => set({ currentUser: user }),
      updateCurrentUser: (userData) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...userData } : null,
        profiles: state.profiles.map(p => p.id === state.currentUser?.id ? { ...p, ...userData } : p),
      })),
      addProfile: (profile) => set((state) => ({
        profiles: state.profiles.some(p => p.id === profile.id)
          ? state.profiles.map(p => p.id === profile.id ? { ...p, ...profile } : p)
          : [...state.profiles, profile],
      })),
      setProfiles: (profiles) => set({ profiles }),
      setKBToggles: (toggles) => set((state) => ({ kbToggles: { ...state.kbToggles, ...toggles } })),
      setMemoryItems: (items) => set({ memoryItems: items }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setPricingRates: (rates) => set((state) => ({ pricingRates: { ...state.pricingRates, ...rates } })),
    }),
    {
      name: 'cockroach-storage',
      version: 7,
      // Only persist session/UI fields to localStorage. DB-backed fields
      // (azureConfig, kbToggles, memoryItems, systemPrompt) re-hydrate from
      // Supabase on user sync — Supabase is the source of truth.
      partialize: (state) => ({
        currentUser: state.currentUser,
        profiles: state.profiles,
        pricingRates: state.pricingRates,
      }),
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Partial<AppState>;
        if (version < 4) {
          return {
            currentUser: null,
            profiles: INITIAL_PROFILES,
            pricingRates: DEFAULT_PRICING,
          } as Partial<AppState>;
        }
        let next = state;
        if (version < 5) {
          next = { ...next, pricingRates: DEFAULT_PRICING };
        }
        if (version < 6) {
          const existing: UserProfile[] = next.profiles ?? [];
          const defaultsById = new Map(INITIAL_PROFILES.map(p => [p.id, p]));
          const merged = existing.map(p => defaultsById.has(p.id) ? { ...p, ...defaultsById.get(p.id)! } : p);
          const existingIds = new Set(existing.map(p => p.id));
          const appended = INITIAL_PROFILES.filter(p => !existingIds.has(p.id));
          next = { ...next, profiles: [...merged, ...appended] };
        }
        // v6 → v7: strip DB-backed fields from persisted state if they exist
        // (they're no longer persisted; they hydrate from Supabase).
        if (version < 7) {
          const {
            azureConfig: _a, kbToggles: _k, memoryItems: _m, systemPrompt: _s,
            ...rest
          } = next as Record<string, unknown>;
          void _a; void _k; void _m; void _s;
          next = rest as Partial<AppState>;
        }
        return next as AppState;
      },
    },
  ),
);
