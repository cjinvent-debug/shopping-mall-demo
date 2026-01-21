# .env 파일 체크리스트

## ✅ 확인해야 할 사항

### 1. 기본 형식
```env
# 올바른 형식
변수명=값

# 잘못된 형식
변수명 = 값  # 공백 있으면 안됨
변수명="값"  # 따옴표 불필요 (특별한 경우 제외)
변수명='값'  # 따옴표 불필요
```

### 2. MongoDB Atlas URL 형식
```env
# ✅ 올바른 형식
MONGODB_ATLAS_URL=mongodb+srv://username:password@cluster.mongodb.net/database-name

# ❌ 잘못된 형식
MONGODB_ATLAS_URL="mongodb+srv://..."  # 따옴표 불필요
MONGODB_ATLAS_URL = mongodb+srv://...  # 공백 있으면 안됨
MONGODB_ATLAS_URL=mongodb+srv://... # 주석  # 주석은 별도 줄에
```

### 3. 필수 환경 변수
```env
# 서버 포트
PORT=5000

# MongoDB (둘 중 하나 또는 둘 다)
MONGODB_ATLAS_URL=mongodb+srv://username:password@cluster.mongodb.net/database-name
# 또는
MONGODB_URI=mongodb://localhost:27017/shopping-mall

# JWT 비밀키
JWT_SECRET=your-secret-key-change-in-production

# 포트원 API 키 (결제 기능 사용 시)
IMP_KEY=your-iamport-key
IMP_SECRET=your-iamport-secret

# Node 환경
NODE_ENV=development
```

### 4. 주의사항

#### ❌ 하지 말아야 할 것
- 변수명과 값 사이에 공백 넣기: `변수 = 값`
- 따옴표로 감싸기: `변수="값"` (특별한 경우 제외)
- 주석을 같은 줄에: `변수=값 # 주석`
- 특수문자 이스케이프 없이 사용

#### ✅ 올바른 예시
```env
# 주석은 별도 줄에
PORT=5000

# 값에 공백이 필요한 경우 따옴표 사용 (드물게)
# 하지만 대부분의 경우 따옴표 없이 사용

# MongoDB 연결 문자열
MONGODB_ATLAS_URL=mongodb+srv://cjinvent_db_user:M28800047@cluster0.cucsuxv.mongodb.net/shopping-mall-demo

# 비밀번호에 특수문자가 있어도 그대로 사용 가능
JWT_SECRET=my-super-secret-key-123!@#
```

### 5. 현재 설정 확인

현재 14번째 줄에 `MONGODB_ATLAS_URL`이 있다고 하셨는데, 다음을 확인해주세요:

1. **형식 확인**
   ```
   MONGODB_ATLAS_URL=mongodb+srv://cjinvent_db_user:M28800047@cluster0.cucsuxv.mongodb.net/shopping-mall-demo
   ```
   - `=` 앞뒤에 공백이 없는지
   - 따옴표로 감싸지 않았는지
   - 주석이 같은 줄에 없는지

2. **연결 문자열 확인**
   - `mongodb+srv://`로 시작하는지
   - 사용자명과 비밀번호가 올바른지
   - 클러스터 주소가 정확한지
   - 데이터베이스 이름이 올바른지

3. **다른 필수 변수 확인**
   - `PORT` 설정 여부
   - `JWT_SECRET` 설정 여부

### 6. 일반적인 문제

#### 문제 1: 공백
```env
# ❌ 잘못됨
MONGODB_ATLAS_URL = mongodb+srv://...

# ✅ 올바름
MONGODB_ATLAS_URL=mongodb+srv://...
```

#### 문제 2: 따옴표
```env
# ❌ 잘못됨 (대부분의 경우)
MONGODB_ATLAS_URL="mongodb+srv://..."

# ✅ 올바름
MONGODB_ATLAS_URL=mongodb+srv://...
```

#### 문제 3: 주석 위치
```env
# ❌ 잘못됨
MONGODB_ATLAS_URL=mongodb+srv://... # MongoDB Atlas

# ✅ 올바름
# MongoDB Atlas 연결
MONGODB_ATLAS_URL=mongodb+srv://...
```

## 🔍 빠른 확인 방법

서버를 실행해서 환경 변수가 제대로 로드되는지 확인:

```bash
cd server
npm run dev
```

성공하면:
```
MongoDB Connected: cluster0.cucsuxv.mongodb.net
Using: MongoDB Atlas
```

실패하면:
- 환경 변수 형식 문제
- MongoDB 연결 문제 (IP 화이트리스트 등)
