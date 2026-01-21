# CloudType 배포 문제 해결 가이드

## 일반적인 에러 및 해결 방법

### 1. 빌드 에러

#### "Cannot find module" 또는 "Module not found"
**원인**: 
- Root Directory가 잘못 설정됨
- `node_modules`가 설치되지 않음

**해결**:
1. CloudType 프로젝트 설정에서 **Root Directory**를 `server`로 설정
2. **Build Command**를 `npm install`로 설정 (또는 비워두기)

#### "Command failed" 또는 빌드 타임아웃
**원인**: 
- 의존성 설치 시간이 너무 오래 걸림
- 네트워크 문제

**해결**:
1. Build Command를 비워두고 CloudType이 자동으로 `npm install` 실행하도록 설정
2. `package.json`의 불필요한 의존성 제거

### 2. 런타임 에러

#### "Port already in use"
**원인**: 포트 충돌

**해결**: 
- CloudType이 자동으로 `PORT` 환경 변수를 제공하므로 문제없음
- `server/app.js`에서 `process.env.PORT || 5000`을 사용 중

#### "MongoDB connection failed"
**원인**: 
- `MONGODB_ATLAS_URL` 환경 변수가 설정되지 않음
- MongoDB Atlas IP 화이트리스트에 CloudType 서버 IP가 없음

**해결**:
1. CloudType 환경 변수에 `MONGODB_ATLAS_URL` 추가
2. MongoDB Atlas 콘솔 > Network Access에서:
   - CloudType 서버 IP 추가, 또는
   - `0.0.0.0/0` (모든 IP 허용) 추가

#### "CORS error"
**원인**: 
- `CLIENT_URL` 환경 변수가 설정되지 않음
- 클라이언트 URL이 CORS 허용 목록에 없음

**해결**:
1. CloudType 환경 변수에 `CLIENT_URL` 추가 (Vercel 배포 URL)
2. 예: `CLIENT_URL=https://your-app.vercel.app`

### 3. 환경 변수 설정

CloudType 프로젝트 설정 > 환경 변수에서 다음을 반드시 설정:

```env
NODE_ENV=production
PORT=5000
MONGODB_ATLAS_URL=mongodb+srv://username:password@cluster.mongodb.net/database
CLIENT_URL=https://your-vercel-app.vercel.app
```

### 4. 로그 확인

CloudType 대시보드에서:
1. **로그** 탭으로 이동
2. 빌드 로그와 런타임 로그 확인
3. 에러 메시지의 전체 내용 확인

### 5. 배포 설정 체크리스트

- [ ] Root Directory: `server`
- [ ] Build Command: `npm install` (또는 비워두기)
- [ ] Start Command: `npm start`
- [ ] Node.js Version: 18.x 이상
- [ ] 환경 변수 `NODE_ENV=production` 설정
- [ ] 환경 변수 `MONGODB_ATLAS_URL` 설정
- [ ] 환경 변수 `CLIENT_URL` 설정 (Vercel 배포 후)

### 6. 헬스 체크

배포 후 다음 URL로 서버 상태 확인:
```
https://your-cloudtype-url.cloudtype.app/
```

정상 응답:
```json
{
  "message": "Shopping Mall API Server is running!"
}
```

### 7. 특정 에러 메시지가 있는 경우

에러 메시지의 전체 내용을 확인하고 다음을 체크:
- 에러가 발생한 단계 (빌드/런타임)
- 에러 메시지의 키워드
- 로그의 마지막 몇 줄

## 추가 도움말

문제가 계속되면:
1. CloudType 로그의 전체 내용 확인
2. 로컬에서 `npm start`로 서버가 정상 실행되는지 확인
3. 환경 변수가 모두 올바르게 설정되었는지 확인
