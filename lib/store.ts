// 전역 상태 관리 (Zustand)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// 간단한 타입 정의 (Supabase용)
// ============================================================================

interface SimpleUser {
  id: string;
  email: string;
  is_admin?: boolean;
  name: string;
}

interface SimpleBalance {
  credits: number;
}

// ============================================================================
// Auth Store
// ============================================================================

interface AuthState {
  user: SimpleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: SimpleUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ============================================================================
// Credits Store
// ============================================================================

interface CreditsState {
  balance: SimpleBalance | null;
  isLoading: boolean;
  
  // Actions
  setBalance: (credits: number) => void;
  updateBalance: (credits: number) => void;
  fetchBalance: () => Promise<void>;
}

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      balance: null,
      isLoading: false,
      setBalance: (credits) => {
        set({ balance: { credits } });
      },
      updateBalance: (credits) => {
        set({ balance: { credits } });
      },
      fetchBalance: async () => {
        const authStore = useAuthStore.getState();
        if (!authStore.user?.id) return;
        
        set({ isLoading: true });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credits/${authStore.user.id}`);
          if (response.ok) {
            const data = await response.json();
            set({ balance: { credits: data.credits || 0 } });
          }
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'credits-storage',
      partialize: (state) => ({ balance: state.balance }),
    }
  )
);

// ============================================================================
// Generation Store (이미지 생성 상태)
// ============================================================================

interface GenerationState {
  // 원본 이미지
  sourceImage: string | null;
  sourceImageFile: File | null;
  
  // 설정
  mode: 'still' | 'model' | 'editorial_product' | 'editorial_model';
  modelType: 'flash' | 'pro';
  gender: string;
  category: string;
  
  // 생성 결과
  generatedImages: string[];
  isGenerating: boolean;
  error: string | null;
  
  // Actions
  setSourceImage: (image: string | null, file?: File | null) => void;
  setMode: (mode: 'still' | 'model' | 'editorial_product' | 'editorial_model') => void;
  setModelType: (type: 'flash' | 'pro') => void;
  setGender: (gender: string) => void;
  setCategory: (category: string) => void;
  setGeneratedImages: (images: string[]) => void;
  setIsGenerating: (value: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>()((set) => ({
  sourceImage: null,
  sourceImageFile: null,
  mode: 'still',
  modelType: 'pro',
  gender: 'auto',
  category: '',
  generatedImages: [],
  isGenerating: false,
  error: null,
  setSourceImage: (image, file = null) => set({ sourceImage: image, sourceImageFile: file }),
  setMode: (mode) => set({ mode }),
  setModelType: (modelType) => set({ modelType }),
  setGender: (gender) => set({ gender }),
  setCategory: (category) => set({ category }),
  setGeneratedImages: (images) => set({ generatedImages: images }),
  setIsGenerating: (value) => set({ isGenerating: value }),
  setError: (error) => set({ error }),
  reset: () => set({
    sourceImage: null,
    sourceImageFile: null,
    mode: 'still',
    modelType: 'pro',
    gender: 'auto',
    category: '',
    generatedImages: [],
    isGenerating: false,
    error: null,
  }),
}));