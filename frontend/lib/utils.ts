// 유틸리티 함수
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// 파일을 Base64로 변환
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64, 부분 제거
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Base64를 다운로드
export function downloadBase64Image(base64: string, filename: string) {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 숫자 포맷 (천 단위 콤마)
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

// 가격 포맷 (원화)
export function formatPrice(price: number): string {
  return `₩${formatNumber(price)}`;
}

// 날짜 포맷
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 상대 시간 포맷
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  
  return formatDate(dateString);
}

// 이미지 모드 한글명
export const modeLabels: Record<string, string> = {
  still: '정물 촬영',
  model: '모델 착용',
  editorial_still: '화보 정물',
  editorial_model: '화보 모델',
};

// 카테고리 한글명
export const categoryLabels: Record<string, string> = {
  bag: '가방',
  wallet: '지갑',
  clothing: '의류',
  outerwear: '아우터',
  top: '상의',
  bottom: '하의',
  dress: '원피스',
  shoes: '신발',
  sneakers: '스니커즈',
  heels: '힐',
  boots: '부츠',
  watch: '시계',
  jewelry: '주얼리',
  necklace: '목걸이',
  bracelet: '팔찌',
  ring: '반지',
  earring: '귀걸이',
  eyewear: '아이웨어',
  sunglasses: '선글라스',
  hat: '모자',
  scarf: '스카프',
  belt: '벨트',
  accessory: '액세서리',
};

// 성별 옵션
export const genderOptions = [
  { value: 'auto', label: '자동 감지' },
  { value: '여성', label: '여성' },
  { value: '남성', label: '남성' },
];
