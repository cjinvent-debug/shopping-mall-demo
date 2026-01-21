const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 미들웨어 설정
// CORS 설정: 프로덕션 환경에서는 배포된 클라이언트 URL 사용, 개발 환경에서는 localhost 사용
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.CLIENT_URL, // Vercel 배포 URL
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null, // Vercel 자동 제공 URL (선택사항)
    ].filter(Boolean) // null 값 제거
  : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // origin이 없으면 (같은 도메인에서 요청) 허용
    if (!origin) return callback(null, true);
    
    // 허용된 origin인지 확인
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // 개발 환경에서는 경고만 출력
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️  CORS: 허용되지 않은 origin: ${origin}`);
        callback(null, true); // 개발 환경에서는 모든 origin 허용
      } else {
        callback(new Error('CORS 정책에 의해 허용되지 않습니다.'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
const connectDB = require('./config/database');

// 서버 시작 전 MongoDB 연결 시도 (재시도 로직은 database.js 내부에 있음)
connectDB().catch(() => {
  // 연결 실패 시 database.js의 재시도 로직이 자동으로 처리
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'Shopping Mall API Server is running!' });
});

// API 라우트 (예시)
app.use('/api', require('./routes'));

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 핸들링 (모든 라우트 매칭 실패 시)
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;

// 서버 시작 (에러 핸들링 포함)
let server;

try {
  server = app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`📍 Health: http://localhost:${PORT}/`);
  });

  // 포트 충돌 에러 핸들링
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error('서버를 시작하기 전에 포트를 정리하는 중...');
      console.error('\n수동으로 종료하려면:');
      console.error('  netstat -ano | findstr :5000');
      console.error('  taskkill /F /PID <PID>\n');
      
      // 3초 후 재시도
      setTimeout(() => {
        console.log('재시도 중...');
        process.exit(1);
      }, 3000);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
} catch (error) {
  console.error('서버 시작 실패:', error);
  process.exit(1);
}

// 프로세스 종료 시 서버 정리
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
