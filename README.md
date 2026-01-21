# Shopping Mall Demo

풀스택 쇼핑몰 데모 프로젝트입니다.

## 프로젝트 구조

```
shopping-mall-demo/
├── client/          # React + Vite 프론트엔드
├── server/          # Express + MongoDB 백엔드
└── package.json     # 루트 스크립트
```

## 설치 방법

### 전체 설치
```bash
npm run install:all
```

### 개별 설치
```bash
# 서버만 설치
npm run install:server

# 클라이언트만 설치
npm run install:client
```

## 실행 방법

### 개발 모드

#### 클라이언트만 실행
```bash
npm run dev
# 또는
npm run dev:client
```

#### 서버만 실행
```bash
npm run dev:server
```

#### 서버와 클라이언트 동시 실행 (권장)
**한 번의 명령으로 서버와 클라이언트를 동시에 실행:**
```bash
npm run dev
```

또는 각각 다른 터미널에서 실행:
```bash
# 터미널 1
npm run dev:server

# 터미널 2
npm run dev:client
```

### 프로덕션 모드

```bash
# 서버 실행
npm start

# 클라이언트 빌드
npm run build
```

## 접속 정보

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000

## 기술 스택

### Frontend
- React 18
- Vite
- React Router DOM
- Axios

### Backend
- Node.js
- Express
- MongoDB (Mongoose)
