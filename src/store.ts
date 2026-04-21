import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  setCurrentUser: (user: UserProfile | null) => void;
  updateCurrentUser: (userData: Partial<UserProfile>) => void;
  addProfile: (profile: UserProfile) => void;
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

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
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
    }),
    {
      name: 'cockroach-storage',
      version: 3, // Bump version to clear out old corrupted profile schemas
      migrate: (persistedState: any, version: number) => {
         if (version < 3) {
            // Force reset on version mismatch to clear previous broken auth schemas
            return {
               currentUser: null,
               profiles: INITIAL_PROFILES,
               azureConfig: {
                  apiKey: 'DKUDyLkncgn1VtOAfJAA9wQdRAOrbQCD2bjLnme8dTlfElC5n1mLJQQJ99CDACYeBjFXJ3w3AAAAACOGNEId',
                  endpoint: 'https://layaaos.cognitiveservices.azure.com/',
                  deployment: 'CockRoach_2.0',
                  model: 'gpt-5.1-chat',
                  version: '2024-12-01-preview'
               }
            };
         }
         return persistedState;
      }
    }
  )
);
