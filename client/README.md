# Shopping Mall Client

Vite + React를 사용한 쇼핑몰 데모 클라이언트입니다.

## 설치 방법

```bash
npm install
```

## 실행 방법

### 개발 모드
```bash
npm run dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
```

### 빌드 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
client/
├── src/
│   ├── App.jsx          # 메인 앱 컴포넌트
│   ├── App.css          # 앱 스타일
│   ├── main.jsx         # React 진입점
│   └── index.css        # 전역 스타일
├── index.html           # HTML 템플릿
├── vite.config.js       # Vite 설정
└── package.json         # 프로젝트 설정
```

## 주요 기능

- ✅ Vite로 빠른 개발 환경
- ✅ React 18
- ✅ React Router DOM (설치 완료)
- ✅ Axios (API 통신용, 설치 완료)
- ✅ 서버 프록시 설정 (포트 5000)

## 서버 연결

클라이언트는 `http://localhost:5000`에서 실행되는 서버와 통신합니다.
Vite 프록시 설정으로 `/api` 요청이 자동으로 서버로 전달됩니다.
