import { GoogleGenAI, Part } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

// ============================================
// 모델 설정 (로컬 Python과 동일)
// ============================================

export const MODEL_CONFIG = {
  flash: {
    name: "gemini-2.0-flash-exp-image-generation",  // 테스트에서 작동 확인된 모델
    credits: 1,
  },
  pro: {
    name: "gemini-2.0-flash-exp-image-generation",  // 일단 동일 (Pro 모델 API 에러로 임시)
    credits: 3,
  }
};

// ============================================
// 카테고리 그룹 설정 (기존 Python 스크립트 그대로)
// ============================================

export type CategoryGroup = "상의" | "하의" | "원피스" | "가방" | "신발" | "시계" | "주얼리" | "아이웨어" | "모자" | "스카프" | "벨트" | "소품";

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

const CATEGORY_CONFIG: Record<string, any> = {
  "의류": {
    name_en: "clothing",
    pose_front: "full body FRONT view - model facing camera, showing outfit clearly",
    pose_side: "full body SIDE view - profile or 3/4 angle showing silhouette",
    pose_back: "full body BACK view - showing rear of the outfit",
    pose_detail: "upper body DETAIL shot - closer view highlighting fabric and design",
    size_note: "", special_instruction: "",
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
    size_note: "", special_instruction: "",
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
    size_note: "", special_instruction: "",
  },
  "스카프": {
    name_en: "scarf/muffler",
    pose_front: "Model wearing scarf around neck, FRONT view",
    pose_side: "Model wearing scarf, SIDE view",
    pose_back: "Model wearing scarf, 3/4 ANGLE view",
    pose_detail: "Close-up DETAIL of scarf ON THE MODEL'S NECK",
    size_note: "", special_instruction: "",
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
// 정물 프롬프트 (기존 Python 스크립트 그대로)
// ============================================

const PROMPT_PRODUCT_SINGLE = `Edit this product photo for luxury e-commerce website.
CRITICAL OUTPUT FORMAT:
- Generate a SINGLE image containing a 2x2 GRID (4 photos arranged in 2 rows, 2 columns)
- The output must be ONE square image divided into 4 equal quadrants
Requirements:
- Remove hanger, mannequin, hanging tag, price tag, label, and background completely
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
- Remove hanger, mannequin, hanging tag, price tag, label, and background completely
- Pure white background (#FFFFFF) with soft natural shadow
- Make product look 3D volumetric with natural shape
- CRITICAL: Product must look pristine, smooth and wrinkle-free like official brand website photos
- 2x2 grid layout: [top-left: front view] [top-right: side view] [bottom-left: back view] [bottom-right: detail close-up]
- Back view must match the actual back shown in the second image
- CRITICAL: Keep ALL original details EXACTLY as shown`;

// ============================================
// 모델 프롬프트 (기존 Python 스크립트 그대로)
// ============================================

function buildModelPrompt(categoryGroup: string, genderModel: string, hasBack: boolean): string {
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
// 이미지 생성 (기존 Python 스크립트 방식 그대로)
// ============================================

export const generateImages = async (
  mode: 'product' | 'model',
  category: CategoryGroup,
  gender: 'female' | 'male',
  mainImageBase64: string,
  subImageBase64: string | null = null,
  modelType: 'flash' | 'pro' = 'flash',
): Promise<string> => {
  
  const mainMime = mainImageBase64.split(';')[0].split(':')[1];
  const mainData = mainImageBase64.split(',')[1];
  
  const imageParts: Part[] = [{ inlineData: { mimeType: mainMime, data: mainData } }];
  
  const hasBack = !!subImageBase64;
  if (subImageBase64) {
    const subMime = subImageBase64.split(';')[0].split(':')[1];
    const subData = subImageBase64.split(',')[1];
    imageParts.push({ inlineData: { mimeType: subMime, data: subData } });
  }

  // 프롬프트 생성 (기존 Python 스크립트 로직 그대로)
  let finalPrompt = "";
  if (mode === 'product') {
    finalPrompt = hasBack ? PROMPT_PRODUCT_DUAL : PROMPT_PRODUCT_SINGLE;
  } else {
    const categoryGroup = getCategoryGroup(category);
    const genderModel = gender === 'male' ? 'MALE' : 'FEMALE';
    finalPrompt = buildModelPrompt(categoryGroup, genderModel, hasBack);
  }

  const parts: Part[] = [{ text: finalPrompt }, ...imageParts];
  const selectedModel = MODEL_CONFIG[modelType].name;

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: { parts },
      config: {
        responseModalities: ['Text', 'Image'],
        temperature: 0.4,  // 기존 Python 설정 그대로
      }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) throw new Error("No candidates returned");
    if (candidates[0].finishReason === 'SAFETY') throw new Error("Safety Block: Content flagged by safety filters.");

    const imagePart = candidates[0].content?.parts?.find((p: any) => p.inlineData);
    
    if (imagePart && imagePart.inlineData) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }
    throw new Error("No image data returned from AI");
  } catch (e: any) {
    console.error("Image generation failed:", e);
    throw e;
  }
};
