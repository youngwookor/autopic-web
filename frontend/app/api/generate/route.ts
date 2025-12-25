import { NextRequest, NextResponse } from 'next/server';

// ============================================
// 모델 설정
// ============================================

const MODEL_MAP = {
  flash: "gemini-2.5-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
};

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;

// ============================================
// 카테고리 설정
// ============================================

const CATEGORY1_TO_GROUP: Record<string, string> = {
  "상의": "의류", "하의": "의류", "아우터": "의류", "의류": "의류", "원피스": "의류",
  "가방": "가방", "신발": "신발", "시계": "시계",
  "키즈": "키즈", "아동": "키즈", "유아": "키즈",
  "펫": "펫용품", "펫용품": "펫용품", "반려동물": "펫용품",
};

const CATEGORY2_TO_GROUP: Record<string, string> = {
  "반지": "주얼리", "팔찌": "주얼리", "목걸이": "주얼리", "귀걸이": "주얼리",
  "아이웨어": "아이웨어", "선글라스": "아이웨어",
  "모자": "모자", "머플러/스카프": "스카프", "스카프": "스카프",
  "벨트": "벨트", "지갑": "소품", "키링": "소품", "기타 잡화": "소품",
  "아동복": "키즈", "유아복": "키즈", "아동신발": "키즈",
  "펫의류": "펫용품", "목줄": "펫용품", "하네스": "펫용품",
};

// TARGET → 카테고리 그룹 오버라이드
const TARGET_TO_CATEGORY: Record<string, string> = {
  "반려동물": "펫용품",
  "아동": "키즈",
};

// 카테고리별 모델 포즈 설정
const CATEGORY_CONFIG: Record<string, any> = {
  "의류": {
    name_en: "clothing",
    pose_front: "full body FRONT view - model facing camera, showing outfit clearly",
    pose_side: "full body SIDE view - profile or 3/4 angle showing silhouette",
    pose_back: "full body BACK view - showing rear of the outfit",
    pose_detail: "upper body DETAIL shot - closer view highlighting fabric and design",
    size_note: "",
    special_instruction: "",
  },
  "가방": {
    name_en: "handbag/bag",
    pose_front: "Model wearing bag on SHOULDER, FRONT view facing camera",
    pose_side: "Model wearing bag, SIDE view showing bag profile and depth",
    pose_back: "Model from BACK, bag worn CROSSBODY so bag's FRONT is visible",
    pose_detail: "Close-up of model's hand HOLDING the bag handle - DETAIL shot",
    size_note: "Bag should look proportional and realistic to model's body. Do NOT exaggerate bag size.",
    special_instruction: "",
  },
  "신발": {
    name_en: "shoes/footwear",
    pose_front: "Full body FRONT view - model standing, shoes clearly visible on feet",
    pose_side: "Full body SIDE view - showing shoe profile and heel",
    pose_back: "Close-up of model's feet from BACK angle - showing heel design",
    pose_detail: "Close-up DETAIL shot of model's feet wearing the shoes",
    size_note: "",
    special_instruction: "",
  },
  "시계": {
    name_en: "wristwatch",
    pose_front: "Model's wrist with watch, FRONT view - watch face clearly visible",
    pose_side: "Model's wrist at natural angle - watch face and profile visible",
    pose_back: "Model wearing watch, 3/4 ANGLE view",
    pose_detail: "Close-up DETAIL of watch ON MODEL'S WRIST",
    size_note: "",
    special_instruction: "CRITICAL: Watch must ALWAYS be worn normally on wrist with face visible.",
  },
  "주얼리": {
    name_en: "jewelry",
    pose_front: "Model wearing jewelry, FRONT view - jewelry clearly visible",
    pose_side: "Model wearing jewelry, SIDE view showing profile",
    pose_back: "Model wearing jewelry, 3/4 ANGLE view",
    pose_detail: "Close-up DETAIL of jewelry ON THE MODEL",
    size_note: "",
    special_instruction: "CRITICAL: Jewelry must always be visible from front.",
  },
  "아이웨어": {
    name_en: "eyewear/sunglasses",
    pose_front: "Model wearing eyewear, FRONT view - face and glasses clearly visible",
    pose_side: "Model wearing eyewear, SIDE PROFILE view",
    pose_back: "Model wearing eyewear, 3/4 ANGLE view",
    pose_detail: "Close-up DETAIL of eyewear on model's face",
    size_note: "",
    special_instruction: "All angles must show the front of the glasses.",
  },
  "모자": {
    name_en: "hat/cap",
    pose_front: "Model wearing hat, FRONT view",
    pose_side: "Model wearing hat, SIDE view showing hat profile",
    pose_back: "Model wearing hat, BACK view",
    pose_detail: "Close-up DETAIL of hat ON THE MODEL'S HEAD",
    size_note: "",
    special_instruction: "",
  },
  "스카프": {
    name_en: "scarf/muffler",
    pose_front: "Model wearing scarf around neck, FRONT view",
    pose_side: "Model wearing scarf, SIDE view",
    pose_back: "Model wearing scarf, 3/4 ANGLE view",
    pose_detail: "Close-up DETAIL of scarf ON THE MODEL'S NECK",
    size_note: "",
    special_instruction: "",
  },
  "벨트": {
    name_en: "belt",
    pose_front: "Model WEARING the belt around waist, FRONT view - buckle visible",
    pose_side: "Model wearing belt, SIDE view",
    pose_back: "Model wearing belt, 3/4 ANGLE view",
    pose_detail: "Close-up DETAIL of belt buckle ON THE MODEL'S WAIST",
    size_note: "",
    special_instruction: "CRITICAL: Model must WEAR the belt around waist in ALL shots.",
  },
  "소품": {
    name_en: "accessory item",
    pose_front: "Model HOLDING the item elegantly, FRONT view",
    pose_side: "Model holding item, SIDE view",
    pose_back: "Model holding item, 3/4 ANGLE view",
    pose_detail: "Close-up DETAIL of item ON/WITH THE MODEL",
    size_note: "",
    special_instruction: "For wallets and small items, model should hold them elegantly.",
  },
  // 키즈 카테고리
  "키즈": {
    name_en: "kids clothing/item",
    pose_front: "CHILD model (age 8-12) wearing item, FRONT view - bright, cheerful expression",
    pose_side: "Child model, SIDE view - playful, natural pose",
    pose_back: "Child model, BACK view - showing rear of outfit",
    pose_detail: "Upper body DETAIL shot - closer view highlighting design",
    size_note: "Use age-appropriate child model (8-12 years old). Keep poses natural and fun.",
    special_instruction: "CRITICAL: Use CHILD model only. Bright, cheerful atmosphere.",
  },
  // 펫용품 카테고리
  "펫용품": {
    name_en: "pet product/accessory",
    pose_front: "Cute pet (dog or cat) wearing/using the product, FRONT view - adorable expression",
    pose_side: "Pet wearing product, SIDE view - showing product clearly on pet",
    pose_back: "Pet wearing product, 3/4 ANGLE view - pet looking adorable",
    pose_detail: "Close-up DETAIL of product ON THE PET - showing quality and design",
    size_note: "Use a cute, well-groomed pet (dog or cat). Pet should be the main focus.",
    special_instruction: "CRITICAL: The product must be worn BY THE PET, not by a human.",
  },
};

function getCategoryGroup(category: string, target?: string): string {
  // TARGET 오버라이드 먼저 체크
  if (target && TARGET_TO_CATEGORY[target]) {
    return TARGET_TO_CATEGORY[target];
  }
  if (CATEGORY1_TO_GROUP[category]) return CATEGORY1_TO_GROUP[category];
  if (CATEGORY2_TO_GROUP[category]) return CATEGORY2_TO_GROUP[category];
  return "의류";
}

// ============================================
// 정물 프롬프트
// ============================================

const PROMPT_PRODUCT_SINGLE = `Edit this product photo for luxury e-commerce website.
CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants
Requirements:
- Remove hanger, mannequin, and background completely
- Pure white background (#FFFFFF) with soft natural shadow
- Make product look 3D volumetric with natural shape
- CRITICAL: Product must look pristine, smooth and wrinkle-free like official brand website photos
- 2x2 grid layout: [top-left: front view] [top-right: side view] [bottom-left: back view] [bottom-right: detail close-up]
- CRITICAL: Keep ALL original details EXACTLY as shown
- Do NOT change any materials, colors, patterns, or design elements`;

// ============================================
// 일반 모델 프롬프트
// ============================================

function buildModelPrompt(categoryGroup: string, genderModel: string): string {
  const config = CATEGORY_CONFIG[categoryGroup] || CATEGORY_CONFIG["의류"];
  
  return `Create professional luxury fashion e-commerce model photos with this exact ${config.name_en}.

${config.size_note}

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

Requirements:
- Use the SAME single ${genderModel} model for ALL 4 shots
- CRITICAL: Same face, same hair, same outfit in ALL 4 images
- Do NOT show the model's full face - crop at jawline/chin level
- Pure white studio background (#FFFFFF)
- 2x2 grid layout:
  [top-left]: ${config.pose_front}
  [top-right]: ${config.pose_side}
  [bottom-left]: ${config.pose_back}
  [bottom-right]: ${config.pose_detail}
- High-end luxury brand website style

${config.special_instruction}

CRITICAL:
- Product must match EXACTLY - same color, pattern, material, design, hardware
- The SAME model must appear in ALL 4 shots with consistent appearance`;
}

// ============================================
// 키즈 모델 프롬프트
// ============================================

function buildKidsModelPrompt(): string {
  return `Create bright, cheerful photos featuring a CHILD model with this exact kids product.

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

MODEL: Adorable CHILD model (age 8-12) with bright smile
- Same child in ALL 4 shots
- Natural, playful expressions
- Age-appropriate styling

VISUAL STYLE:
- Bright, colorful, cheerful atmosphere
- Soft natural lighting
- Pure white or light pastel background
- Warm, happy mood

2x2 GRID LAYOUT:
[TOP-LEFT]: Full body FRONT view - child facing camera with cheerful expression
[TOP-RIGHT]: Full body SIDE view - playful, natural pose
[BOTTOM-LEFT]: Full body BACK view - showing rear of outfit
[BOTTOM-RIGHT]: Upper body DETAIL shot - highlighting design and fabric

CRITICAL: 
- Use CHILD model ONLY (not adult)
- Product must match EXACTLY
- Same child model in ALL shots`;
}

// ============================================
// 펫 모델 프롬프트
// ============================================

function buildPetModelPrompt(): string {
  return `Create adorable pet photos featuring a cute pet wearing/using this exact product.

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants

SUBJECT: Cute, well-groomed PET (dog or cat) - NOT a human model
- Same pet in ALL 4 shots
- Pet must be WEARING or USING the product
- Adorable, photogenic pet with expressive eyes

VISUAL STYLE:
- Warm, cozy atmosphere
- Soft natural lighting
- Pure white or warm neutral background
- Loving, heartwarming mood

2x2 GRID LAYOUT:
[TOP-LEFT]: Pet wearing product, FRONT view - adorable expression facing camera
[TOP-RIGHT]: Pet wearing product, SIDE view - showing product clearly
[BOTTOM-LEFT]: Pet wearing product, 3/4 ANGLE view - different cute pose
[BOTTOM-RIGHT]: Close-up DETAIL of product ON THE PET - showing quality

ABSOLUTELY CRITICAL: 
- The product must be worn BY THE PET (dog or cat), NOT by a human
- Do NOT show any human wearing pet clothes
- Same pet in ALL 4 shots
- Product must match EXACTLY`;
}

// ============================================
// API Route Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 새로운 파라미터 형식과 기존 형식 모두 지원
    const mode = body.mode || 'product';
    const category = body.category || '의류';
    const gender = body.gender || 'auto';
    const target = body.target || '사람';
    const modelType = body.model_type || body.modelType || 'flash';
    const imageBase64 = body.image_base64 || body.mainImage;

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 이미지 데이터 추출
    const mainData = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const mainMime = imageBase64.includes(';') ? imageBase64.split(';')[0].split(':')[1] : 'image/jpeg';

    // 프롬프트 생성
    let prompt = "";
    
    if (mode === 'product' || mode === 'still') {
      prompt = PROMPT_PRODUCT_SINGLE;
    } else {
      // 모델 모드
      const categoryGroup = getCategoryGroup(category, target);
      
      if (categoryGroup === "펫용품" || target === "반려동물") {
        // 펫용품 전용 프롬프트
        prompt = buildPetModelPrompt();
        console.log('Using PET prompt');
      } else if (categoryGroup === "키즈" || target === "아동") {
        // 키즈 전용 프롬프트
        prompt = buildKidsModelPrompt();
        console.log('Using KIDS prompt');
      } else {
        // 일반 모델 프롬프트
        const genderModel = gender === 'male' ? 'MALE' : 'FEMALE';
        prompt = buildModelPrompt(categoryGroup, genderModel);
        console.log('Using GENERAL prompt, Category Group:', categoryGroup);
      }
    }

    // Gemini API 호출
    const selectedModel = MODEL_MAP[modelType as keyof typeof MODEL_MAP] || MODEL_MAP.flash;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${API_KEY}`;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mainMime, data: mainData } }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        responseModalities: ["IMAGE", "TEXT"]
      }
    };

    console.log('========== GEMINI API CALL ==========');
    console.log('Model Type:', modelType);
    console.log('Selected Model:', selectedModel);
    console.log('Mode:', mode);
    console.log('Category:', category);
    console.log('Target:', target);
    console.log('=====================================');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return NextResponse.json({ error: `Gemini API Error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ error: 'No candidates returned' }, { status: 500 });
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      return NextResponse.json({ error: 'No parts in response' }, { status: 500 });
    }

    const imagePart = parts.find((p: any) => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      return NextResponse.json({ error: 'No image data in response' }, { status: 500 });
    }

    const imageBase64Result = imagePart.inlineData.data;
    const imageMime = imagePart.inlineData.mimeType || 'image/png';

    // 2x2 그리드 이미지를 4개로 분할
    const splitImages = await splitGridImage(imageBase64Result, imageMime);

    // 크레딧 계산
    const creditsUsed = modelType === 'pro' ? 3 : 1;

    return NextResponse.json({
      success: true,
      images: splitImages,
      model_used: modelType,
      credits_used: creditsUsed,
      credits_remaining: 0,
      cost_estimate: creditsUsed * 137,
    });

  } catch (error: any) {
    console.error('Generate API Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// 2x2 그리드 이미지를 4개로 분할하는 함수
async function splitGridImage(base64Data: string, mimeType: string): Promise<string[]> {
  // 서버사이드에서는 sharp 등을 사용해야 하지만,
  // 간단히 하나의 이미지를 반환 (클라이언트에서 분할 처리)
  // 실제로는 AWS 백엔드에서 분할 처리됨
  
  // 임시로 같은 이미지 4개 반환 (실제로는 분할 필요)
  const fullImage = `data:${mimeType};base64,${base64Data}`;
  return [fullImage, fullImage, fullImage, fullImage];
}
