import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    // 나이스페이 결제창에서 POST로 결과 전달
    const formData = await request.formData();
    
    const authResultCode = formData.get('authResultCode') as string;
    const authResultMsg = formData.get('authResultMsg') as string;
    const tid = formData.get('tid') as string;
    const orderId = formData.get('orderId') as string;
    const amount = formData.get('amount') as string;
    const mallReserved = formData.get('mallReserved') as string;
    
    console.log('나이스페이 빌링 콜백:', { authResultCode, authResultMsg, tid, orderId, amount });
    
    // 인증 실패 시
    if (authResultCode !== '0000') {
      const errorMsg = encodeURIComponent(authResultMsg || '인증 실패');
      return NextResponse.redirect(
        new URL(`/pricing/billing-fail?error=${errorMsg}`, request.url)
      );
    }
    
    // mallReserved에서 userId, plan, isAnnual 추출
    let userId = '';
    let plan = '';
    let isAnnual = false;
    
    try {
      const reserved = JSON.parse(mallReserved || '{}');
      userId = reserved.userId || '';
      plan = reserved.plan || '';
      isAnnual = reserved.isAnnual || false;
    } catch (e) {
      console.error('mallReserved 파싱 오류:', e);
    }
    
    if (!userId || !plan || !tid) {
      return NextResponse.redirect(
        new URL('/pricing/billing-fail?error=필수 정보가 누락되었습니다', request.url)
      );
    }
    
    // 백엔드에 빌키 발급 + 첫 결제 요청
    const subscribeResponse = await fetch(`${API_URL}/api/nicepay/billing/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        plan: plan,
        auth_result_code: authResultCode,
        tid: tid,
        order_id: orderId,
        is_annual: isAnnual,
      }),
    });
    
    const result = await subscribeResponse.json();
    
    if (result.success) {
      // 성공 - billing-success 페이지로 리다이렉트
      const params = new URLSearchParams({
        plan: result.plan || '',
        planName: result.plan_name || '',
        credits: String(result.credits_granted || 0),
        amount: String(result.amount_paid || 0),
        nextBillingDate: result.next_billing_date || '',
      });
      
      return NextResponse.redirect(
        new URL(`/pricing/billing-success?${params.toString()}`, request.url)
      );
    } else {
      // 실패
      const errorMsg = encodeURIComponent(result.error || '구독 생성 실패');
      return NextResponse.redirect(
        new URL(`/pricing/billing-fail?error=${errorMsg}`, request.url)
      );
    }
    
  } catch (error: any) {
    console.error('나이스페이 빌링 처리 오류:', error);
    const errorMsg = encodeURIComponent(error.message || '처리 중 오류 발생');
    return NextResponse.redirect(
      new URL(`/pricing/billing-fail?error=${errorMsg}`, request.url)
    );
  }
}

export async function GET(request: Request) {
  // GET 방식 콜백도 처리 (일부 케이스)
  const { searchParams } = new URL(request.url);
  
  const authResultCode = searchParams.get('authResultCode');
  const authResultMsg = searchParams.get('authResultMsg');
  
  if (authResultCode !== '0000') {
    const errorMsg = encodeURIComponent(authResultMsg || '인증 실패');
    return NextResponse.redirect(
      new URL(`/pricing/billing-fail?error=${errorMsg}`, request.url)
    );
  }
  
  // GET으로 올 경우 정보가 부족하므로 실패 처리
  return NextResponse.redirect(
    new URL('/pricing/billing-fail?error=잘못된 접근입니다', request.url)
  );
}
