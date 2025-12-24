import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// 인증 함수
// ============================================

export async function signUp(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
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
        prompt: 'consent',
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
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
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
      amount: credits * 100, // 예시 금액
      credits: credits,
      payment_key: paymentKey
    });
  }
  
  return profile.credits + credits;
}
