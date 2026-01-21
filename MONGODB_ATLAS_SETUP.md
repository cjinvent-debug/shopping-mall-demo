# MongoDB Atlas 연결 설정 가이드

## 🔧 .env 파일 설정

`server/.env` 파일에 다음 내용을 추가하거나 업데이트하세요:

```env
MONGODB_ATLAS_URL=mongodb+srv://cjinvent_db_user:M28800047@cluster0.cucsuxv.mongodb.net/shopping-mall-demo
```

## ⚠️ 연결 실패 시 확인 사항

### 1. 인증 정보 확인
- MongoDB Atlas 콘솔 → Database Access
- 사용자 이름: `cjinvent_db_user`
- 비밀번호가 올바른지 확인
- 사용자 권한이 올바르게 설정되어 있는지 확인

### 2. IP 화이트리스트 설정 (중요!)
MongoDB Atlas는 보안을 위해 IP 화이트리스트를 사용합니다.

**설정 방법:**
1. MongoDB Atlas 콘솔 접속
2. **Network Access** 메뉴로 이동
3. **Add IP Address** 클릭
4. 다음 중 하나 선택:
   - **현재 IP 주소 추가**: "Add Current IP Address" 버튼 클릭
   - **모든 IP 허용** (개발 환경): `0.0.0.0/0` 입력 후 Confirm

**⚠️ 주의**: `0.0.0.0/0`은 모든 IP를 허용하므로 프로덕션 환경에서는 사용하지 마세요.

### 3. 연결 문자열 형식 확인
올바른 형식:
```
mongodb+srv://username:password@cluster.mongodb.net/database-name
```

옵션 추가 (권장):
```
mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
```

### 4. 클러스터 상태 확인
- MongoDB Atlas 콘솔에서 클러스터가 실행 중인지 확인
- 클러스터가 일시 중지되어 있으면 시작해야 합니다

## ✅ 연결 테스트

서버를 실행하면 자동으로 MongoDB 연결을 시도합니다:

```bash
cd server
npm run dev
```

성공 시 콘솔에 다음이 표시됩니다:
```
MongoDB Connected: cluster0.cucsuxv.mongodb.net
Using: MongoDB Atlas
```

## 🔄 우선순위

현재 코드는 다음 우선순위로 MongoDB를 연결합니다:

1. **MONGODB_ATLAS_URL** (최우선) - Atlas 클라우드
2. **MONGODB_URI** (두 번째) - 로컬 또는 다른 MongoDB
3. **기본값** (마지막) - `mongodb://localhost:27017/shopping-mall`

## 📝 현재 설정된 연결 문자열

```
mongodb+srv://cjinvent_db_user:M28800047@cluster0.cucsuxv.mongodb.net/shopping-mall-demo
```

이 연결 문자열을 `server/.env` 파일에 추가하세요.
