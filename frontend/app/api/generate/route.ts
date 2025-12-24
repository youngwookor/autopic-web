import { NextRequest, NextResponse } from 'next/server';

// ============================================
// 모델 설정 (로컬 Python과 동일)
// ============================================

const MODEL_MAP = {
  flash: "gemini-2.5-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
};

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;

// ============================================
// 카테고리 설정 (로컬 Python 그대로)
// ============================================

const CATEGORY1_TO_GROUP: Record<string, string> = {
  "상의": "의류", "하의": "의류", "아우터": "의류", "의류": "의류", "원피스": "의류",
  "가방": "가방", "신발": "신발", "시계": "시계",
};

const CATEGORY2_TO_GROUP: Record<string, string> = {
  "반지": "주얼리", "팔찌": "주얼리", "목걸이": "주얼리", "귀걸이": "주얼리",
  "아이웨어": "아이웨어", "선글라스": "아이웨어",
  "모자": "모자", "머플러/스카프": "스카프", "스카프": "스카프",
  "벨트": "벨트", "지갑": "소품", "키링": "소품", "기타 잡화": "소품",
};

// 카테고리별 모델 포즈 설정 (로컬과 동일)
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
    pose_back: "Close-up of model's feet from BACK angle - showing heel design (focus on feet and shoes only)",
    pose_detail: "Close-up DETAIL shot of model's feet wearing the shoes - showing texture and craftsmanship",
    size_note: "",
    special_instruction: "",
  },
  "시계": {
    name_en: "wristwatch",
    pose_front: "Model's wrist with watch, FRONT view - watch face clearly visible facing camera",
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
};

function getCategoryGroup(category: string): string {
  if (CATEGORY1_TO_GROUP[category]) return CATEGORY1_TO_GROUP[category];
  if (CATEGORY2_TO_GROUP[category]) return CATEGORY2_TO_GROUP[category];
  return "의류";
}

// ============================================
// 정물 프롬프트 (로컬과 동일 - soft natural shadow 포함)
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

const PROMPT_PRODUCT_DUAL = `Edit these product photos for luxury e-commerce website.
IMPORTANT:
- First image is the FRONT view - use as primary reference
- Second image shows the BACK - use for accurate back view recreation
CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants
Requirements:
- Remove hanger, mannequin, and background completely
- Pure white background (#FFFFFF) with soft natural shadow
- Make product look 3D volumetric with natural shape
- CRITICAL: Product must look pristine, smooth and wrinkle-free like official brand website photos
- 2x2 grid layout: [top-left: front view] [top-right: side view] [bottom-left: back view] [bottom-right: detail close-up]
- Back view must match the actual back shown in the second image
- CRITICAL: Keep ALL original details EXACTLY as shown`;

// ============================================
// 모델 프롬프트 - 일반 (로컬과 동일)
// ============================================

const PROMPT_MODEL_SINGLE = `Create professional luxury fashion e-commerce model photos wearing this exact product.
CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants
Requirements:
- Use the SAME single {gender_model} model for ALL 4 shots
- IMPORTANT: Do NOT show the model's full face - crop at jawline/chin level
- Pure white studio background (#FFFFFF)
- 2x2 grid layout: [top-left: full body front] [top-right: full body side] [bottom-left: full body back] [bottom-right: upper body detail]
- High-end luxury brand website style
- CRITICAL: Product must match EXACTLY - same color, pattern, material, design`;

const PROMPT_MODEL_DUAL = `Create professional luxury fashion e-commerce model photos wearing this exact product.
IMPORTANT:
- First image is the FRONT view - use as primary reference
- Second image shows the BACK - use for accurate back view on model
CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants
Requirements:
- Use the SAME single {gender_model} model for ALL 4 shots
- Do NOT show the model's full face - crop at jawline/chin level
- Pure white studio background (#FFFFFF)
- 2x2 grid layout: [top-left: front view] [top-right: side view] [bottom-left: back view matching second image] [bottom-right: detail close-up]
- CRITICAL: Product must match EXACTLY in all shots`;

// ============================================
// 모델 프롬프트 - 가방 전용 (사이즈 정확도 강조)
// ============================================

const PROMPT_MODEL_BAG_SINGLE = `Create professional luxury fashion e-commerce model photos with this exact handbag.

CRITICAL SIZE ACCURACY:
- Look at the reference image carefully to understand the actual bag size
- The bag width should be approximately the same as the model's shoulder width or slightly smaller
- Do NOT exaggerate the bag size - keep it realistic and proportional
- When worn on shoulder, the bag body should sit around hip to waist level
- The bag should NOT dominate the model's frame - it should look natural and elegant

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants
Requirements:
- Use the SAME single {gender_model} model for ALL 4 shots
- Do NOT show the model's full face - crop at jawline/chin level
- Pure white studio background (#FFFFFF)
- 2x2 grid layout:
  [top-left]: Model wearing bag on SHOULDER, front view
  [top-right]: Model wearing bag, side view  
  [bottom-left]: Model from BACK, bag worn CROSSBODY so bag's FRONT is visible
  [bottom-right]: Close-up of model's hand HOLDING the bag handle
- High-end luxury brand website style
- CRITICAL: Bag must match EXACTLY - same color, pattern, chain, hardware`;

const PROMPT_MODEL_BAG_DUAL = `Create professional luxury fashion e-commerce model photos with this exact handbag.
IMPORTANT:
- First image is the FRONT view - use as primary reference
- Second image shows the BACK - use for accurate back view on model

CRITICAL SIZE ACCURACY:
- Look at the reference image carefully to understand the actual bag size
- The bag width should be approximately the same as the model's shoulder width or slightly smaller
- Do NOT exaggerate the bag size - keep it realistic and proportional
- When worn on shoulder, the bag body should sit around hip to waist level
- The bag should NOT dominate the model's frame - it should look natural and elegant

CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants
Requirements:
- Use the SAME single {gender_model} model for ALL 4 shots
- Do NOT show the model's full face - crop at jawline/chin level
- Pure white studio background (#FFFFFF)
- 2x2 grid layout:
  [top-left]: Model wearing bag on SHOULDER, front view
  [top-right]: Model wearing bag, side view  
  [bottom-left]: Model from BACK, bag worn CROSSBODY so bag's FRONT is visible
  [bottom-right]: Close-up of model's hand HOLDING the bag handle
- High-end luxury brand website style
- CRITICAL: Bag must match EXACTLY - same color, pattern, chain, hardware`;

// ============================================
// 카테고리 그룹 기반 모델 프롬프트 생성 (로컬과 동일)
// ============================================

function buildModelPrompt(categoryGroup: string, genderModel: string, hasBack: boolean): string {
  // 가방은 전용 프롬프트 사용
  if (categoryGroup === "가방") {
    const prompt = hasBack ? PROMPT_MODEL_BAG_DUAL : PROMPT_MODEL_BAG_SINGLE;
    return prompt.replace(/{gender_model}/g, genderModel);
  }
  
  const config = CATEGORY_CONFIG[categoryGroup] || CATEGORY_CONFIG["의류"];
  
  if (hasBack) {
    return `Create professional luxury fashion e-commerce model photos with this exact ${config.name_en}.
IMPORTANT:
- First image is the FRONT view - use as primary reference
- Second image shows the BACK - use for accurate back view on model

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
  } else {
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
}

// ============================================
// API Route Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, category, gender, mainImage, subImage, modelType } = body;

    // 이미지 데이터 추출 (data:image/...;base64, 제거)
    const mainData = mainImage.split(',')[1];
    const mainMime = mainImage.split(';')[0].split(':')[1];

    // 프롬프트 생성
    let prompt = "";
    const hasBack = !!subImage;
    
    if (mode === 'product') {
      prompt = hasBack ? PROMPT_PRODUCT_DUAL : PROMPT_PRODUCT_SINGLE;
    } else {
      const categoryGroup = getCategoryGroup(category);
      const genderModel = gender === 'male' ? 'MALE' : 'FEMALE';
      prompt = buildModelPrompt(categoryGroup, genderModel, hasBack);
      console.log('Category Group:', categoryGroup);
    }

    // 이미지 파트 구성
    const imageParts: any[] = [
      { inline_data: { mime_type: mainMime, data: mainData } }
    ];

    if (subImage) {
      const subData = subImage.split(',')[1];
      const subMime = subImage.split(';')[0].split(':')[1];
      imageParts.push({ inline_data: { mime_type: subMime, data: subData } });
    }

    // Gemini API 직접 호출 (로컬 Python과 동일한 방식)
    const selectedModel = MODEL_MAP[modelType as keyof typeof MODEL_MAP] || MODEL_MAP.flash;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${API_KEY}`;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          ...imageParts
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        responseModalities: ["IMAGE", "TEXT"]
      }
    };

    console.log('========== GEMINI API CALL ==========');
    console.log('Model Type (from UI):', modelType);
    console.log('Selected Model:', selectedModel);
    console.log('Mode:', mode);
    console.log('Category:', category);
    console.log('Has Back Image:', hasBack);
    console.log('=====================================');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return NextResponse.json({ error: `Gemini API Error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    
    // 이미지 데이터 추출
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ error: 'No candidates returned' }, { status: 500 });
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      return NextResponse.json({ error: 'No parts in response' }, { status: 500 });
    }

    // 이미지 파트 찾기
    const imagePart = parts.find((p: any) => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      return NextResponse.json({ error: 'No image data in response' }, { status: 500 });
    }

    const imageBase64 = imagePart.inlineData.data;
    const imageMime = imagePart.inlineData.mimeType || 'image/png';

    return NextResponse.json({
      success: true,
      image: `data:${imageMime};base64,${imageBase64}`
    });

  } catch (error: any) {
    console.error('Generate API Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
