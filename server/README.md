# Shopping Mall Server

Node.js, Express, MongoDB를 사용한 쇼핑몰 데모 서버입니다.

## 설치 방법

1. 의존성 설치
```bash
npm install
```

2. 환경 변수 설정
`.env.example` 파일을 참고하여 `.env` 파일을 생성하고 MongoDB 연결 정보를 입력하세요.

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shopping-mall
NODE_ENV=development
```

## 실행 방법

### 개발 모드 (nodemon 사용)
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm start
```

## 프로젝트 구조

```
server/
├── app.js              # 메인 서버 파일
├── config/
│   └── database.js     # MongoDB 연결 설정
├── routes/
│   └── index.js        # API 라우트
├── .env                # 환경 변수 (생성 필요)
├── .env.example        # 환경 변수 예시
└── package.json        # 프로젝트 설정
```

## MongoDB 연결

MongoDB가 로컬에 설치되어 있지 않은 경우:
- MongoDB Atlas (클라우드) 사용: https://www.mongodb.com/cloud/atlas
- 또는 Docker로 MongoDB 실행: `docker run -d -p 27017:27017 mongo`

## API 엔드포인트

- `GET /` - 서버 상태 확인
- `GET /api/test` - API 테스트
