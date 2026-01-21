# MongoDB 연결 상태 확인 결과

## 🔍 테스트 결과

### MongoDB Atlas 연결
- **상태**: ❌ 연결 실패
- **에러**: `bad auth : authentication failed`
- **원인**: 인증 정보가 잘못되었거나 IP 화이트리스트 설정이 필요할 수 있습니다.

### 로컬 MongoDB 연결
- **상태**: 확인 중

## 🔧 해결 방법

### MongoDB Atlas 연결 문제 해결

1. **인증 정보 확인**
   - MongoDB Atlas에서 사용자 이름과 비밀번호가 올바른지 확인
   - `.env` 파일의 `MONGODB_ATLAS_URL`에 올바른 인증 정보가 포함되어 있는지 확인

2. **IP 화이트리스트 설정**
   - MongoDB Atlas 콘솔에서 "Network Access" 메뉴로 이동
   - 현재 IP 주소를 화이트리스트에 추가
   - 또는 `0.0.0.0/0`을 추가하여 모든 IP 허용 (개발 환경에서만)

3. **연결 문자열 형식 확인**
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database-name>?retryWrites=true&w=majority
   ```

### 로컬 MongoDB 사용

로컬 MongoDB를 사용하려면:

1. **MongoDB 설치 확인**
   ```bash
   mongod --version
   ```

2. **MongoDB 서비스 시작** (Windows)
   ```bash
   net start MongoDB
   ```

3. **또는 Docker로 실행**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

4. **.env 파일에서 MONGODB_ATLAS_URL 제거 또는 주석 처리**
   ```env
   # MONGODB_ATLAS_URL=mongodb+srv://...
   MONGODB_URI=mongodb://localhost:27017/shopping-mall
   ```

## 📝 현재 설정

현재 코드는 다음 우선순위로 MongoDB를 연결합니다:

1. `MONGODB_ATLAS_URL` (최우선)
2. `MONGODB_URI` (두 번째)
3. 기본 로컬 주소: `mongodb://localhost:27017/shopping-mall` (마지막)

## ✅ 연결 확인 방법

서버를 실행하면 자동으로 MongoDB 연결을 시도하고, 연결 상태가 콘솔에 표시됩니다:

```bash
cd server
npm run dev
```

성공 시:
```
MongoDB Connected: cluster0.xxxxx.mongodb.net
Using: MongoDB Atlas
```

또는

```
MongoDB Connected: localhost
Using: Local MongoDB
```
