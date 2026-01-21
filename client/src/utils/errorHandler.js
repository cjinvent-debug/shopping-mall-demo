/**
 * 에러 핸들링 유틸리티
 * 일관된 에러 처리를 위한 헬퍼 함수들
 */

/**
 * API 에러를 사용자 친화적인 메시지로 변환
 * @param {Error} error - Axios 에러 객체
 * @returns {string} 사용자 친화적인 에러 메시지
 */
export const getErrorMessage = (error) => {
  if (!error.response) {
    return '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
  }

  const status = error.response.status;
  const errorData = error.response.data || {};

  // 서버에서 제공한 메시지가 있으면 사용
  if (errorData.message) {
    return errorData.message;
  }

  // 상태 코드에 따른 기본 메시지
  const statusMessages = {
    400: '잘못된 요청입니다.',
    401: '로그인이 필요합니다. 다시 로그인해주세요.',
    403: '접근 권한이 없습니다.',
    404: '요청한 리소스를 찾을 수 없습니다.',
    409: '이미 존재하는 데이터입니다.',
    422: '입력 데이터가 올바르지 않습니다.',
    500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    503: '서비스를 일시적으로 사용할 수 없습니다.',
  };

  return statusMessages[status] || '알 수 없는 오류가 발생했습니다.';
};

/**
 * 에러를 콘솔에 안전하게 로깅 (개발 환경에서만)
 * @param {string} context - 에러가 발생한 컨텍스트
 * @param {Error} error - 에러 객체
 */
export const logError = (context, error) => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
      console.error('상태 코드:', error.response.status);
    }
  }
};

/**
 * API 에러를 처리하고 사용자에게 알림
 * @param {string} context - 에러 컨텍스트
 * @param {Error} error - 에러 객체
 * @param {Function} onError - 에러 발생 시 실행할 콜백 (선택사항)
 */
export const handleApiError = (context, error, onError) => {
  logError(context, error);
  const message = getErrorMessage(error);
  
  if (onError && typeof onError === 'function') {
    onError(message);
  } else {
    alert(message);
  }
  
  return message;
};
