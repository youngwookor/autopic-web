-- ============================================================================
-- AUTOPIC 구독 시스템 - Supabase 테이블 및 함수
-- ============================================================================
-- 실행 순서: Supabase Dashboard > SQL Editor에서 실행
-- ============================================================================

-- 1. subscriptions 테이블 생성
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 플랜 정보
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'basic')),
    plan_name TEXT NOT NULL,
    monthly_credits INTEGER NOT NULL DEFAULT 100,
    price INTEGER NOT NULL,
    
    -- 결제 정보 (토스 빌링키)
    billing_key TEXT,
    customer_key TEXT,
    
    -- 상태 관리
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'paused')),
    
    -- 기간 관리
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    
    -- 크레딧 지급 추적
    last_credit_granted_at TIMESTAMP WITH TIME ZONE,
    credits_granted_this_period INTEGER DEFAULT 0,
    
    -- 취소 관련
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date) 
    WHERE status = 'active';

-- RLS 정책
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재실행 시 에러 방지)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;

-- 사용자는 자신의 구독만 조회 가능
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- 서비스 역할만 삽입/수정/삭제 가능 (백엔드에서 처리)
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');


-- 2. profiles 테이블 tier 컬럼 확인/추가
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'tier'
    ) THEN
        ALTER TABLE profiles ADD COLUMN tier TEXT DEFAULT 'free';
    END IF;
END $$;

-- tier 체크 제약 추가 (기존 있으면 삭제 후 재생성)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_tier_check 
    CHECK (tier IN ('free', 'starter', 'basic'));


-- 3. subscription_history 테이블 (결제/갱신 이력)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 이벤트 정보
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created', 'renewed', 'cancelled', 'expired', 
        'credits_granted', 'payment_success', 'payment_failed',
        'plan_changed', 'reactivated'
    )),
    
    -- 상세 정보
    plan TEXT,
    amount INTEGER,
    credits_granted INTEGER,
    
    -- 결제 정보
    payment_key TEXT,
    payment_method TEXT,
    
    -- 메타데이터
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON subscription_history(user_id);

ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription history" ON subscription_history;
CREATE POLICY "Users can view own subscription history" ON subscription_history
    FOR SELECT USING (auth.uid() = user_id);


-- ============================================================================
-- 완료! 
-- 이제 백엔드 API를 통해 구독을 관리할 수 있습니다.
-- ============================================================================
