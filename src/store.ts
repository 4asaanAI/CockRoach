import { create } from 'zustand';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isInitial?: boolean;
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
  setAzureConfig: (config: any) => void;
  setCurrentUser: (user: UserProfile) => void;
  updateCurrentUser: (userData: Partial<UserProfile>) => void;
  addProfile: (profile: UserProfile) => void;
};

const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'dagna-1',
    name: 'DagnA',
    email: 'dagna@cockroach.ai', /* Restoring typical default but editable via settings */
    avatar: '',
    isInitial: true,
  }
];

export const useAppStore = create<AppState>((set) => ({
  currentUser: INITIAL_PROFILES[0],
  profiles: INITIAL_PROFILES,
  azureConfig: {
    apiKey: 'DKUDyLkncgn1VtOAfJAA9wQdRAOrbQCD2bjLnme8dTlfElC5n1mLJQQJ99CDACYeBjFXJ3w3AAAAACOGNEId',
    endpoint: 'https://layaaos.cognitiveservices.azure.com/',
    deployment: 'CockRoach_2.0',
    model: 'gpt-5.1-chat',
    version: '2024-12-01-preview'
  },
  setAzureConfig: (config) => set((state) => ({ azureConfig: { ...state.azureConfig, ...config } })),
  setCurrentUser: (user) => set({ currentUser: user }),
  updateCurrentUser: (userData) => set((state) => ({
    currentUser: state.currentUser ? { ...state.currentUser, ...userData } : null,
    profiles: state.profiles.map(p => p.id === state.currentUser?.id ? { ...p, ...userData } : p)
  })),
  addProfile: (profile) => set((state) => ({ 
    profiles: [...state.profiles, profile] 
  })),
}));
