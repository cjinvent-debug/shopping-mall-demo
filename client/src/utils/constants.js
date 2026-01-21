/**
 * 상수 정의
 * 애플리케이션 전역에서 사용하는 상수들
 */

// 사용자 타입
export const USER_TYPES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
};

// 주문 상태
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PREPARING: 'PREPARING',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

// 주문 상태 라벨 (한국어)
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: '주문 대기',
  [ORDER_STATUS.PAYMENT_COMPLETED]: '결제 완료',
  [ORDER_STATUS.PREPARING]: '배송 준비 중',
  [ORDER_STATUS.SHIPPING]: '배송 중',
  [ORDER_STATUS.DELIVERED]: '배송 완료',
  [ORDER_STATUS.CANCELLED]: '주문 취소',
};

// 결제 상태
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

// 결제 상태 라벨 (한국어)
export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: '결제 대기',
  [PAYMENT_STATUS.COMPLETED]: '결제 완료',
  [PAYMENT_STATUS.FAILED]: '결제 실패',
  [PAYMENT_STATUS.REFUNDED]: '환불 완료',
};

// 결제 방법
export const PAYMENT_METHODS = {
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  VIRTUAL_ACCOUNT: 'VIRTUAL_ACCOUNT',
  MOBILE: 'MOBILE',
};

// 결제 방법 라벨 (한국어)
export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CARD]: '신용카드',
  [PAYMENT_METHODS.BANK_TRANSFER]: '계좌이체',
  [PAYMENT_METHODS.VIRTUAL_ACCOUNT]: '가상계좌',
  [PAYMENT_METHODS.MOBILE]: '휴대폰 결제',
};

// 상품 카테고리
export const PRODUCT_CATEGORIES = {
  CAMERA: '카메라',
  LENS: '렌즈',
};

// 페이지네이션 기본값
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// 포맷팅 함수
export const formatPrice = (price) => {
  if (!price && price !== 0) return '가격 문의';
  return `${Number(price).toLocaleString('ko-KR')} 원`;
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('ko-KR');
};
