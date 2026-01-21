/**
 * API 설정 파일
 * 환경 변수에 따라 API URL을 동적으로 설정
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    ME: `${API_BASE_URL}/api/auth/me`,
  },
  
  // 사용자
  USERS: {
    BASE: `${API_BASE_URL}/api/users`,
    BY_ID: (id) => `${API_BASE_URL}/api/users/${id}`,
    BY_EMAIL: (email) => `${API_BASE_URL}/api/users/email/${email}`,
  },
  
  // 상품
  PRODUCTS: {
    BASE: `${API_BASE_URL}/api/products`,
    BY_ID: (id) => `${API_BASE_URL}/api/products/${id}`,
    BY_NUMBER: (number) => `${API_BASE_URL}/api/products/number/${number}`,
  },
  
  // 장바구니
  CART: {
    BASE: `${API_BASE_URL}/api/cart`,
    BY_ID: (id) => `${API_BASE_URL}/api/cart/${id}`,
    CLEAR: `${API_BASE_URL}/api/cart/clear`,
  },
  
  // 주문
  ORDERS: {
    BASE: `${API_BASE_URL}/api/orders`,
    BY_ID: (id) => `${API_BASE_URL}/api/orders/${id}`,
  },
};

export default API_BASE_URL;
