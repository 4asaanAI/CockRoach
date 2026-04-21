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
    avatar: '',
    isInitial: true,
  }
];

const DEFAULT_AZURE_CONFIG = {
  apiKey: 'DKUDyLkncgn1VtOAfJAA9wQdRAOrbQCD2bjLnme8dTlfElC5n1mLJQQJ99CDACYeBjFXJ3w3AAAAACOGNEId',
  endpoint: 'https://layaaos.cognitiveservices.azure.com/',
  deployment: 'CockRoach_2.0',
  model: 'gpt-5.3-chat',
  version: '2024-12-01-preview',
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
      version: 5,
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
        // v4 → v5: add pricingRates without resetting anything else
        if (version < 5) {
          return { ...persistedState, pricingRates: DEFAULT_PRICING };
        }
        return persistedState;
      }
    }
  )
);
