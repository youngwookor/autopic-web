import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 세션 지속성 및 자동 갱신 옵션 추가
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'autopic-auth',
  },
});

// ============================================
// 인증 함수
// ============================================

export async function signUp(email: string, password: string, name?: string, phone?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      data: { name, phone }
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',  // 'consent' → 'select_account'로 변경 (매번 동의 요청 X)
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithKakao() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'profile_nickname profile_image',
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  // 로컬 스토리지 클리어
  if (typeof window !== 'undefined') {
    localStorage.removeItem('autopic-auth');
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('credits-storage');
  }
  
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}

// ============================================
// 프로필/크레딧 함수
// ============================================

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: { name?: string; phone?: string }) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}

export async function updateCredits(userId: string, creditsToDeduct: number) {
  // 현재 크레딧 확인
  const profile = await getProfile(userId);
  if (profile.credits < creditsToDeduct) {
    throw new Error('크레딧이 부족합니다');
  }
  
  // 크레딧 차감
  const { error } = await supabase
    .from('profiles')
    .update({ credits: profile.credits - creditsToDeduct })
    .eq('id', userId);
  if (error) throw error;
  
  // 사용 내역 기록
  await supabase.from('usages').insert({
    user_id: userId,
    action: 'image_generation',
    credits_used: creditsToDeduct
  });
  
  return profile.credits - creditsToDeduct;
}

export async function addCredits(userId: string, credits: number, paymentKey?: string) {
  const profile = await getProfile(userId);
  
  // 크레딧 추가
  const { error } = await supabase
    .from('profiles')
    .update({ credits: profile.credits + credits })
    .eq('id', userId);
  if (error) throw error;
  
  // 결제 내역 기록
  if (paymentKey) {
    await supabase.from('payments').insert({
      user_id: userId,
      amount: credits * 100,
      credits: credits,
      payment_key: paymentKey
    });
  }
  
  return profile.credits + credits;
}
