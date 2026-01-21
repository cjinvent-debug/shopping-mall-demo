# 로그인 기능 구현 가이드

## 현재 구현된 기능 ✅
- ✅ User 모델 (이메일, 비밀번호, 사용자 타입)
- ✅ 회원가입 기능 (비밀번호 해시화 포함)
- ✅ bcrypt 설치 완료

## 로그인 기능 구현에 필요한 항목

### 1. 백엔드 (서버) 기능

#### 1.1 JWT (JSON Web Token) 패키지 설치
- **목적**: 로그인 상태를 유지하기 위한 토큰 생성
- **패키지**: `jsonwebtoken`
- **설치**: `npm install jsonwebtoken`

#### 1.2 로그인 컨트롤러 생성
- **파일**: `server/controllers/authController.js`
- **기능**:
  - 이메일로 사용자 조회
  - 비밀번호 검증 (bcrypt.compare)
  - JWT 토큰 생성
  - 로그인 성공 시 토큰 반환

#### 1.3 로그인 라우트 생성
- **파일**: `server/routes/auth.js`
- **엔드포인트**: `POST /api/auth/login`
- **요청 데이터**: `{ email, password }`
- **응답**: `{ success, token, user }`

#### 1.4 인증 미들웨어 생성
- **파일**: `server/middleware/auth.js`
- **기능**: 
  - JWT 토큰 검증
  - 보호된 라우트 접근 제어
  - 사용자 정보를 req.user에 추가

#### 1.5 현재 사용자 조회 API
- **엔드포인트**: `GET /api/auth/me`
- **기능**: 토큰으로 현재 로그인한 사용자 정보 조회

#### 1.6 로그아웃 API (선택사항)
- **엔드포인트**: `POST /api/auth/logout`
- **기능**: 클라이언트에서 토큰 삭제 (서버는 stateless이므로 클라이언트에서 처리)

### 2. 프론트엔드 (클라이언트) 기능

#### 2.1 로그인 페이지 생성
- **파일**: `client/src/pages/Login.jsx`
- **기능**:
  - 이메일, 비밀번호 입력 폼
  - 로그인 요청
  - 에러 처리
  - 성공 시 토큰 저장 및 리다이렉트

#### 2.2 인증 Context 생성
- **파일**: `client/src/context/AuthContext.jsx`
- **기능**:
  - 로그인 상태 관리
  - 토큰 저장/조회 (localStorage)
  - 사용자 정보 관리
  - 로그인/로그아웃 함수 제공

#### 2.3 보호된 라우트 컴포넌트
- **파일**: `client/src/components/ProtectedRoute.jsx`
- **기능**: 로그인하지 않은 사용자 접근 차단

#### 2.4 Axios 인터셉터 설정
- **파일**: `client/src/utils/axios.js` 또는 `client/src/config/axios.js`
- **기능**:
  - 모든 요청에 토큰 자동 추가
  - 토큰 만료 시 자동 로그아웃

#### 2.5 홈페이지에 로그인 버튼 추가
- **파일**: `client/src/pages/Home.jsx`
- **기능**: 로그인 페이지로 이동하는 버튼

#### 2.6 네비게이션 바 (선택사항)
- **파일**: `client/src/components/Navbar.jsx`
- **기능**:
  - 로그인 상태 표시
  - 로그인/로그아웃 버튼
  - 사용자 정보 표시

### 3. 보안 고려사항

#### 3.1 환경 변수 설정
- **파일**: `server/.env`
- **변수**: `JWT_SECRET` (토큰 서명용 비밀키)

#### 3.2 토큰 만료 시간 설정
- **Access Token**: 1시간 (짧은 만료)
- **Refresh Token**: 7일 (선택사항, 더 안전한 구현)

#### 3.3 비밀번호 검증
- bcrypt.compare로 해시된 비밀번호와 비교
- 잘못된 이메일/비밀번호 시 동일한 에러 메시지 (보안)

### 4. 구현 순서 추천

1. **백엔드 기본 구조**
   - JWT 패키지 설치
   - 로그인 컨트롤러 생성
   - 로그인 라우트 생성
   - 테스트

2. **프론트엔드 기본 구조**
   - 로그인 페이지 생성
   - 로그인 API 연동
   - 토큰 저장 (localStorage)
   - 테스트

3. **인증 시스템 완성**
   - AuthContext 생성
   - 인증 미들웨어 생성
   - 보호된 라우트 구현
   - Axios 인터셉터 설정

4. **UI/UX 개선**
   - 네비게이션 바
   - 로그인 상태 표시
   - 로그아웃 기능

### 5. 필요한 패키지

#### 서버
```bash
npm install jsonwebtoken
```

#### 클라이언트
- 이미 설치됨: `axios`, `react-router-dom`
- 추가 필요 없음 (기본 기능만 사용)

### 6. API 엔드포인트 요약

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|-----------|------|----------|
| POST | `/api/auth/login` | 로그인 | ❌ |
| GET | `/api/auth/me` | 현재 사용자 조회 | ✅ |
| POST | `/api/auth/logout` | 로그아웃 | ✅ (선택) |

### 7. 데이터 흐름

```
1. 사용자가 로그인 폼 작성
   ↓
2. POST /api/auth/login 요청
   ↓
3. 서버: 이메일로 사용자 조회
   ↓
4. 서버: 비밀번호 검증 (bcrypt.compare)
   ↓
5. 서버: JWT 토큰 생성
   ↓
6. 서버: 토큰과 사용자 정보 반환
   ↓
7. 클라이언트: 토큰을 localStorage에 저장
   ↓
8. 클라이언트: 이후 모든 요청에 토큰 포함
   ↓
9. 서버: 미들웨어로 토큰 검증
   ↓
10. 서버: req.user에 사용자 정보 추가
```

## 다음 단계

위의 항목들을 순서대로 구현하면 완전한 로그인 시스템을 만들 수 있습니다.
