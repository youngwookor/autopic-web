import { NextRequest, NextResponse } from 'next/server';

/**
 * 나이스페이 결제창에서 returnUrl로 POST 요청이 옵니다.
 * 이 요청을 받아서 success 페이지로 리다이렉트합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 나이스페이에서 POST로 전달하는 데이터 파싱
    const formData = await request.formData();
    
    const resultCode = formData.get('resultCode') as string;
    const resultMsg = formData.get('resultMsg') as string;
    const tid = formData.get('tid') as string;
    const orderId = formData.get('orderId') as string;
    const amount = formData.get('amount') as string;
    const authToken = formData.get('authToken') as string;

    console.log('나이스페이 인증 결과:', { resultCode, resultMsg, tid, orderId, amount });

    // 인증 성공 (resultCode가 0000이면 성공)
    if (resultCode === '0000') {
      // 성공 페이지로 리다이렉트 (GET 파라미터로 전달)
      const successUrl = new URL('/pricing/success', request.url);
      successUrl.searchParams.set('tid', tid || '');
      successUrl.searchParams.set('orderId', orderId || '');
      successUrl.searchParams.set('amount', amount || '');
      successUrl.searchParams.set('authToken', authToken || '');
      
      return NextResponse.redirect(successUrl);
    } else {
      // 실패 페이지로 리다이렉트
      const failUrl = new URL('/pricing/fail', request.url);
      failUrl.searchParams.set('code', resultCode || 'UNKNOWN');
      failUrl.searchParams.set('message', resultMsg || '결제 인증 실패');
      
      return NextResponse.redirect(failUrl);
    }
  } catch (error) {
    console.error('나이스페이 콜백 처리 오류:', error);
    
    const failUrl = new URL('/pricing/fail', request.url);
    failUrl.searchParams.set('code', 'CALLBACK_ERROR');
    failUrl.searchParams.set('message', '결제 처리 중 오류가 발생했습니다');
    
    return NextResponse.redirect(failUrl);
  }
}

// GET 요청도 처리 (테스트용)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const resultCode = searchParams.get('resultCode');
  const tid = searchParams.get('tid');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  if (resultCode === '0000' && tid) {
    const successUrl = new URL('/pricing/success', request.url);
    successUrl.searchParams.set('tid', tid);
    successUrl.searchParams.set('orderId', orderId || '');
    successUrl.searchParams.set('amount', amount || '');
    
    return NextResponse.redirect(successUrl);
  } else {
    const failUrl = new URL('/pricing/fail', request.url);
    failUrl.searchParams.set('code', resultCode || 'UNKNOWN');
    failUrl.searchParams.set('message', '결제 인증 실패');
    
    return NextResponse.redirect(failUrl);
  }
}
