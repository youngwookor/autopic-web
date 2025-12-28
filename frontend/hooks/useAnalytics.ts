'use client';

import { sendGAEvent, sendMetaEvent } from '@/components/Analytics';

// AUTOPIC 전용 Analytics 훅
export function useAnalytics() {
  
  // ===== 회원가입 관련 =====
  const trackSignUp = (method: string = 'email') => {
    // GA4
    sendGAEvent('sign_up', {
      method: method,
    });
    // Meta Pixel
    sendMetaEvent('CompleteRegistration', {
      content_name: 'AUTOPIC 회원가입',
      status: true,
    });
  };

  // ===== 로그인 =====
  const trackLogin = (method: string = 'email') => {
    sendGAEvent('login', {
      method: method,
    });
  };

  // ===== 이미지 생성 관련 =====
  const trackImageGenerate = (params: {
    productType: string;      // 패션, 키즈, 펫, 식품
    imageType: string;        // 정물, 인물
    creditsUsed: number;      // 사용 크레딧
  }) => {
    // GA4
    sendGAEvent('generate_image', {
      product_type: params.productType,
      image_type: params.imageType,
      credits_used: params.creditsUsed,
      currency: 'KRW',
    });
    // Meta Pixel - 커스텀 이벤트
    sendMetaEvent('GenerateImage', {
      product_type: params.productType,
      image_type: params.imageType,
      credits_used: params.creditsUsed,
    });
  };

  // ===== 결제/구매 관련 =====
  const trackPurchase = (params: {
    transactionId: string;
    value: number;            // 결제 금액 (KRW)
    credits: number;          // 구매한 크레딧
    planName?: string;        // 플랜명 (선택)
  }) => {
    // GA4 - 전자상거래 구매
    sendGAEvent('purchase', {
      transaction_id: params.transactionId,
      value: params.value,
      currency: 'KRW',
      items: [{
        item_name: params.planName || `${params.credits} 크레딧`,
        item_category: 'credits',
        quantity: 1,
        price: params.value,
      }],
    });
    // Meta Pixel - 구매
    sendMetaEvent('Purchase', {
      value: params.value,
      currency: 'KRW',
      content_name: params.planName || `${params.credits} 크레딧`,
      content_type: 'product',
      content_ids: [params.transactionId],
    });
  };

  // ===== 결제 시작 (장바구니 추가) =====
  const trackInitiateCheckout = (params: {
    value: number;
    credits: number;
    planName?: string;
  }) => {
    // GA4
    sendGAEvent('begin_checkout', {
      value: params.value,
      currency: 'KRW',
      items: [{
        item_name: params.planName || `${params.credits} 크레딧`,
        item_category: 'credits',
        quantity: 1,
        price: params.value,
      }],
    });
    // Meta Pixel
    sendMetaEvent('InitiateCheckout', {
      value: params.value,
      currency: 'KRW',
      content_name: params.planName || `${params.credits} 크레딧`,
      num_items: 1,
    });
  };

  // ===== 가격 페이지 조회 =====
  const trackViewPricing = () => {
    sendGAEvent('view_item_list', {
      item_list_name: 'pricing_plans',
    });
    sendMetaEvent('ViewContent', {
      content_name: '가격 플랜',
      content_type: 'product_group',
    });
  };

  // ===== 페이지 뷰 (SPA 네비게이션용) =====
  const trackPageView = (pagePath: string, pageTitle?: string) => {
    sendGAEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  };

  // ===== 버튼 클릭 추적 =====
  const trackButtonClick = (buttonName: string, location?: string) => {
    sendGAEvent('click', {
      button_name: buttonName,
      location: location || 'unknown',
    });
  };

  // ===== 무료 체험 시작 =====
  const trackStartTrial = () => {
    sendGAEvent('start_trial', {
      trial_type: 'free_credits',
    });
    sendMetaEvent('StartTrial', {
      trial_type: 'free_credits',
    });
  };

  return {
    trackSignUp,
    trackLogin,
    trackImageGenerate,
    trackPurchase,
    trackInitiateCheckout,
    trackViewPricing,
    trackPageView,
    trackButtonClick,
    trackStartTrial,
  };
}

export default useAnalytics;
