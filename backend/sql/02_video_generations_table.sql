-- ============================================================================
-- AUTOPIC 360° 비디오 생성 시스템 - Supabase 테이블
-- ============================================================================
-- 실행: Supabase Dashboard > SQL Editor에서 실행
-- ============================================================================

-- 1. video_generations 테이블 생성
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 입력 이미지 (base64 또는 URL)
    source_images JSONB NOT NULL, -- [{url: "...", view: "front"}, ...]
    
    -- 생성 설정
    duration_seconds INTEGER NOT NULL DEFAULT 8,
    
    -- 상태 관리
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0, -- 0-100
    
    -- 결과
    video_url TEXT,
    video_bytes_size INTEGER,
    
    -- 크레딧
    credits_used INTEGER NOT NULL DEFAULT 30,
    
    -- 에러 정보
    error_message TEXT,
    
    -- Google Cloud 작업 ID
    gcp_operation_id TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- 만료 (7일 후 삭제)
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_status ON video_generations(status);
CREATE INDEX IF NOT EXISTS idx_video_generations_created ON video_generations(created_at DESC);

-- RLS 정책
ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재실행 시 에러 방지)
DROP POLICY IF EXISTS "Users can view own video generations" ON video_generations;
DROP POLICY IF EXISTS "Users can insert own video generations" ON video_generations;
DROP POLICY IF EXISTS "Service role can manage video generations" ON video_generations;

-- 사용자는 자신의 비디오만 조회 가능
CREATE POLICY "Users can view own video generations" ON video_generations
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 비디오 생성 가능
CREATE POLICY "Users can insert own video generations" ON video_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 서비스 역할은 모든 작업 가능
CREATE POLICY "Service role can manage video generations" ON video_generations
    FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- 완료!
-- ============================================================================
