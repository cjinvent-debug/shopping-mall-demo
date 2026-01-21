# 배포 가이드

## CloudType 서버 배포 설정

### 1. 프로젝트 설정

CloudType 대시보드에서 다음 설정을 사용하세요:

- **Root Directory**: `server`
- **Build Command**: `npm install` (또는 비워두기 - CloudType이 자동으로 실행)
- **Start Command**: `npm start`
- **Node.js Version**: 18.x 이상 (권장: 20.x)

### 2. 환경 변수 설정

CloudType 프로젝트 설정 > 환경 변수에서 다음을 추가:

```
NODE_ENV=production
PORT=5000
MONGODB_ATLAS_URL=mongodb+srv://cjinvent_db_user:6rFVcdRf8qyWEIH@cluster0.9imjhjk.mongodb.net/shopping-mall-demo
CLIENT_URL=https://your-vercel-app.vercel.app
```

**중요**: 
- `MONGODB_ATLAS_URL`의 비밀번호는 실제 값으로 변경하세요
- `CLIENT_URL`은 Vercel 배포 후 실제 URL로 변경하세요

### 3. 포트 설정

CloudType은 자동으로 `PORT` 환경 변수를 제공합니다. 
`server/app.js`에서 `process.env.PORT || 5000`을 사용하므로 자동으로 처리됩니다.

### 4. 일반적인 에러 해결

#### 에러: "Cannot find module"
- **원인**: `node_modules`가 설치되지 않음
- **해결**: Root Directory가 `server`로 설정되어 있는지 확인

#### 에러: "Port already in use"
- **원인**: 포트 충돌
- **해결**: CloudType이 자동으로 PORT를 할당하므로 문제없음

#### 에러: "MongoDB connection failed"
- **원인**: 환경 변수 미설정 또는 MongoDB Atlas IP 화이트리스트
- **해결**: 
  1. `MONGODB_ATLAS_URL` 환경 변수 확인
  2. MongoDB Atlas > Network Access에서 CloudType 서버 IP 추가 (또는 0.0.0.0/0으로 모든 IP 허용)

#### 에러: "CORS error"
- **원인**: 클라이언트 URL이 CORS 설정에 없음
- **해결**: `CLIENT_URL` 환경 변수를 정확히 설정

### 5. 배포 확인

배포 후 다음 URL로 헬스 체크:
```
https://your-cloudtype-url.cloudtype.app/
```

응답 예시:
```json
{
  "message": "Shopping Mall API Server is running!"
}
```

## Vercel 클라이언트 배포 설정

### 1. 프로젝트 설정

Vercel 대시보드에서:
- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2. 환경 변수 설정

```
VITE_API_BASE_URL=https://your-cloudtype-server-url.cloudtype.app
```

### 3. 배포 확인

배포 후 클라이언트에서 API 호출이 정상 작동하는지 확인
