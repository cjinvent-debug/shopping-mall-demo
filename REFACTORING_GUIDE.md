# 코드 리팩토링 가이드

## 📋 개선 완료 사항

### 1. 공통 유틸리티 생성 ✅
- `client/src/config/api.js`: API 엔드포인트 중앙 관리
- `client/src/utils/api.js`: Axios 인스턴스 및 인터셉터
- `client/src/utils/errorHandler.js`: 일관된 에러 처리
- `client/src/utils/constants.js`: 상수 정의

### 2. 문서화 ✅
- `CODE_REVIEW.md`: 코드 점검 보고서
- `PROJECT_STRUCTURE.md`: 프로젝트 구조 및 역할별 정리

## 🔄 리팩토링 필요 파일 목록

### 우선순위 높음 (핵심 기능)

#### 1. API 호출이 많은 페이지
- `client/src/pages/Home.jsx`
- `client/src/pages/ProductDetail.jsx`
- `client/src/pages/Cart.jsx`
- `client/src/pages/Checkout.jsx`
- `client/src/pages/admin/Admin.jsx`
- `client/src/pages/admin/AdminOrder.jsx`
- `client/src/pages/admin/AdminUser.jsx`

#### 2. 디버깅 코드가 많은 파일
- `client/src/pages/admin/AdminProductNew.jsx` (가격 포맷팅 관련)
- `client/src/pages/ProductDetail.jsx` (장바구니 추가 관련)
- `client/src/pages/Checkout.jsx` (결제 관련)

### 우선순위 중간

- `client/src/pages/OrderList.jsx`
- `client/src/pages/OrderDetail.jsx`
- `client/src/pages/MyPage.jsx`
- `client/src/pages/CategoryPage.jsx`
- `client/src/components/Navbar.jsx`

## 📝 리팩토링 예시

### Before (기존 코드)
```javascript
// 하드코딩된 API URL
const response = await axios.get('http://localhost:5000/api/products')

// 직접적인 에러 처리
catch (error) {
  console.error('오류:', error)
  alert('오류가 발생했습니다.')
}
```

### After (개선된 코드)
```javascript
import apiClient, { API_ENDPOINTS } from '../utils/api'
import { handleApiError } from '../utils/errorHandler'

// 환경 변수 기반 API 호출
const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE)

// 일관된 에러 처리
catch (error) {
  handleApiError('상품 조회', error)
}
```

## 🛠️ 단계별 리팩토링 방법

### Step 1: Import 추가
```javascript
import apiClient, { API_ENDPOINTS } from '../utils/api'
import { handleApiError, logError } from '../utils/errorHandler'
import { formatPrice, ORDER_STATUS_LABELS } from '../utils/constants'
```

### Step 2: API 호출 변경
```javascript
// 기존
const response = await axios.get('http://localhost:5000/api/products')

// 변경
const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BASE)
```

### Step 3: 에러 처리 변경
```javascript
// 기존
catch (error) {
  console.error('오류:', error)
  alert('오류가 발생했습니다.')
}

// 변경
catch (error) {
  handleApiError('상품 조회', error, (message) => {
    // 커스텀 에러 처리 (선택사항)
    setError(message)
  })
}
```

### Step 4: 디버깅 코드 제거/조건부 처리
```javascript
// 기존
console.log('[디버깅] 데이터:', data)

// 변경 (개발 환경에서만)
if (import.meta.env.DEV) {
  console.log('[디버깅] 데이터:', data)
}
```

## ⚠️ 주의사항

1. **점진적 리팩토링**: 한 번에 모든 파일을 수정하지 말고, 하나씩 테스트하며 진행
2. **기능 테스트**: 리팩토링 후 반드시 해당 기능이 정상 작동하는지 확인
3. **환경 변수 설정**: `.env` 파일을 생성하고 필요한 값 설정
4. **토큰 관리**: `api.js`의 인터셉터가 자동으로 토큰을 추가하므로, 기존 코드에서 수동으로 추가한 부분 제거

## 📦 환경 변수 설정

### 서버 (server/.env)
```env
PORT=5000
# MongoDB Atlas URL (우선 사용)
MONGODB_ATLAS_URL=mongodb+srv://username:password@cluster.mongodb.net/shopping-mall
# 또는 로컬 MongoDB (MONGODB_ATLAS_URL이 없을 때 사용)
MONGODB_URI=mongodb://localhost:27017/shopping-mall
JWT_SECRET=your-secret-key-change-in-production
IMP_KEY=your-iamport-key
IMP_SECRET=your-iamport-secret
NODE_ENV=development
```

### 클라이언트 (client/.env)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
VITE_IMP_CUSTOMER_CODE=imp84223558
```

## 🎯 다음 단계

1. 환경 변수 파일 생성
2. 주요 페이지 리팩토링 (우선순위 높음)
3. 디버깅 코드 정리
4. 전체 테스트
5. 문서 업데이트
