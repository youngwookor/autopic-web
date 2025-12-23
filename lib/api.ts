// API 클라이언트 설정
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Axios 인스턴스 생성
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 401 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그아웃
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Auth API
// ============================================================================

export interface User {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  company_name: string | null;
  tier: string;
  credits: number;
  flash_available: number;
  pro_available: number;
  is_verified: boolean;
  is_subscribed: boolean;
  is_admin: boolean;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  default_model: string;
  business_type: string;
  created_at: string;
  last_login: string | null;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authApi = {
  // 회원가입
  register: async (email: string, password: string, name?: string) => {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  // 로그인
  login: async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // 현재 사용자 정보
  getMe: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // 로그아웃
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

// ============================================================================
// Credits API
// ============================================================================

export interface CreditBalance {
  credits: number;
  tier: string;
  flash_available: number;
  pro_available: number;
  is_subscribed: boolean;
  subscription_expires_at: string | null;
}

export interface CreditHistory {
  total: number;
  page: number;
  page_size: number;
  items: Array<{
    id: number;
    action: string;
    model_type: string | null;
    credits_used: number;
    cost_estimate: number;
    success: boolean;
    created_at: string;
  }>;
}

export const creditsApi = {
  // 잔액 조회
  getBalance: async () => {
    const response = await api.get<CreditBalance>('/credits/balance');
    return response.data;
  },

  // 사용 내역
  getHistory: async (limit = 20, offset = 0) => {
    const response = await api.get<CreditHistory>('/credits/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  // 사용량 요약
  getSummary: async (days = 30) => {
    const response = await api.get('/credits/summary', {
      params: { days },
    });
    return response.data;
  },
};

// ============================================================================
// Images API
// ============================================================================

export interface GenerateRequest {
  image_base64?: string;
  image_url?: string;
  mode: 'still' | 'model' | 'editorial_still' | 'editorial_model';
  model_type: 'flash' | 'pro';
  gender?: string;
  category?: string;
}

export interface GenerateResponse {
  success: boolean;
  images: string[];
  image_urls: string[];
  model_used: string;
  credits_used: number;
  credits_remaining: number;
  processing_time: number;
  cost_estimate: number;
  error?: string;
}

export interface DetectCategoryResponse {
  success: boolean;
  category1?: string;
  category2?: string;
  gender?: string;
  error?: string;
}

export const imagesApi = {
  // 이미지 생성
  generate: async (request: GenerateRequest) => {
    const response = await api.post<GenerateResponse>('/images/generate', request);
    return response.data;
  },

  // 카테고리 감지
  detectCategory: async (imageBase64?: string, imageUrl?: string) => {
    const response = await api.post<DetectCategoryResponse>('/images/detect-category', null, {
      params: { image_base64: imageBase64, image_url: imageUrl },
    });
    return response.data;
  },

  // 모델 정보
  getModels: async () => {
    const response = await api.get('/images/models');
    return response.data;
  },

  // 생성 이력
  getHistory: async (limit = 20, offset = 0) => {
    const response = await api.get('/images/history', {
      params: { limit, offset },
    });
    return response.data;
  },
};

// ============================================================================
// Pricing API
// ============================================================================

export interface PricingInfo {
  free_credits: number;
  subscriptions: Record<string, {
    name: string;
    monthly_price: number;
    annual_price: number;
    credits_per_month: number;
    features: string[];
    includes_desktop: boolean;
  }>;
  credit_packages: Record<string, {
    name: string;
    credits: number;
    price: number;
    per_credit: number;
    includes_desktop: boolean;
  }>;
  models: Record<string, {
    name: string;
    credits_per_use: number;
    description: string;
    cost_per_image: number;
  }>;
}

export const pricingApi = {
  // 요금제 정보
  getPricing: async () => {
    const response = await api.get<PricingInfo>('/pricing');
    return response.data;
  },
};

// ============================================================================
// Admin API
// ============================================================================

export interface DashboardStats {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
  total_generations: number;
  generations_today: number;
  generations_week: number;
  total_credits_used: number;
  credits_used_today: number;
  credits_used_week: number;
  total_revenue: number;
  revenue_month: number;
  users_by_tier: Record<string, number>;
}

export interface AdminUserItem {
  id: number;
  email: string;
  name: string | null;
  tier: string;
  credits: number;
  is_active: boolean;
  is_admin: boolean;
  generation_count: number;
  created_at: string;
  last_login: string | null;
}

export interface AdminUserDetail {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  company_name: string | null;
  tier: string;
  credits: number;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  default_model: string;
  created_at: string;
  last_login: string | null;
  total_generations: number;
  total_credits_used: number;
  total_payments: number;
}

export interface UserListResponse {
  items: AdminUserItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface UserUpdateRequest {
  name?: string;
  tier?: string;
  is_active?: boolean;
  is_admin?: boolean;
}

export interface CreditAdjustmentRequest {
  amount: number;
  reason: string;
}

export const adminApi = {
  // 대시보드 통계
  getDashboard: async () => {
    const response = await api.get<DashboardStats>('/admin/dashboard');
    return response.data;
  },

  // 유저 목록
  getUsers: async (params: {
    skip?: number;
    limit?: number;
    search?: string;
    tier?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const response = await api.get<UserListResponse>('/admin/users', { params });
    return response.data;
  },

  // 유저 상세
  getUser: async (userId: number) => {
    const response = await api.get<AdminUserDetail>(`/admin/users/${userId}`);
    return response.data;
  },

  // 유저 수정
  updateUser: async (userId: number, data: UserUpdateRequest) => {
    const response = await api.patch<AdminUserDetail>(`/admin/users/${userId}`, data);
    return response.data;
  },

  // 크레딧 조정
  adjustCredits: async (userId: number, data: CreditAdjustmentRequest) => {
    const response = await api.post(`/admin/users/${userId}/credits`, data);
    return response.data;
  },

  // 사용 기록 조회
  getUsages: async (params: {
    skip?: number;
    limit?: number;
    user_id?: number;
    action?: string;
    success?: boolean;
  }) => {
    const response = await api.get('/admin/usages', { params });
    return response.data;
  },

  // 생성 기록 조회
  getGenerations: async (params: {
    skip?: number;
    limit?: number;
    user_id?: number;
    mode?: string;
    model_type?: string;
  }) => {
    const response = await api.get('/admin/generations', { params });
    return response.data;
  },

  // 관리자 권한 부여 (초기 설정용)
  makeAdmin: async (userId: number, secretKey: string) => {
    const response = await api.post(`/admin/make-admin/${userId}`, null, {
      params: { secret_key: secretKey }
    });
    return response.data;
  },
};

export default api;
