const mongoose = require('mongoose');
require('dotenv').config();

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5초

const connectDB = async (retryCount = 0) => {
  try {
    // 환경변수 확인
    if (retryCount === 0) {
      console.log('\n=== MongoDB 연결 시도 ===');
    } else {
      console.log(`\n=== MongoDB 재연결 시도 (${retryCount}/${MAX_RETRIES}) ===`);
    }
    
    console.log('MONGODB_ATLAS_URL 존재 여부:', process.env.MONGODB_ATLAS_URL ? '✅ 있음' : '❌ 없음');
    
    // MONGODB_ATLAS_URL 사용, 없으면 로컬 MongoDB 사용
    const mongoUri = process.env.MONGODB_ATLAS_URL || 'mongodb://localhost:27017/shopping-mall';
    
    // 안전한 URL 표시 (비밀번호 숨김)
    const safeUrl = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('사용할 MongoDB URI:', safeUrl);
    console.log('연결 타입:', process.env.MONGODB_ATLAS_URL ? 'MongoDB Atlas' : 'Local MongoDB');
    
    // 연결 옵션 설정
    const options = {
      serverSelectionTimeoutMS: 15000, // 15초 타임아웃
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    };
    
    // 이미 연결되어 있으면 확인만
    if (mongoose.connection.readyState === 1) {
      console.log('✅ 이미 MongoDB에 연결되어 있습니다.');
      console.log(`   호스트: ${mongoose.connection.host}`);
      console.log(`   데이터베이스: ${mongoose.connection.name}`);
      return;
    }
    
    // 연결 중이면 기다림
    if (mongoose.connection.readyState === 2) {
      console.log('⏳ MongoDB 연결 중... 기다리는 중...');
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', resolve);
        setTimeout(resolve, 5000); // 최대 5초 대기
      });
      if (mongoose.connection.readyState === 1) {
        console.log('✅ MongoDB 연결 완료!');
        return;
      }
    }
    
    // 기존 연결이 있으면 정리
    if (mongoose.connection.readyState === 3) {
      console.log('기존 연결을 정리하는 중...');
      try {
        await mongoose.connection.close();
      } catch (err) {
        // 연결 정리 실패는 무시
      }
    }
    
    const conn = await mongoose.connect(mongoUri, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   데이터베이스: ${conn.connection.name}`);
    console.log(`   상태: ${conn.connection.readyState === 1 ? '연결됨' : '연결 안됨'}`);
    console.log('=== 연결 성공 ===\n');
    
    // 연결 이벤트 리스너 설정 (한 번만 설정)
    if (!mongoose.connection._hasListeners) {
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB 연결 오류:', err.message);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB 연결이 끊어졌습니다. 재연결을 시도합니다...');
        // 연결이 끊어졌을 때만 재연결 시도
        if (mongoose.connection.readyState === 0) {
          setTimeout(() => connectDB(0), RETRY_DELAY);
        }
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB 재연결 성공!');
      });
      
      mongoose.connection._hasListeners = true;
    }
    
  } catch (error) {
    console.error('\n❌ MongoDB connection error:');
    console.error('   에러 메시지:', error.message);
    console.error('   에러 코드:', error.code || 'N/A');
    
    if (error.message.includes('authentication failed')) {
      console.error('   💡 인증 실패: 사용자 이름 또는 비밀번호를 확인하세요.');
      console.error('   💡 MongoDB Atlas 콘솔에서 사용자 비밀번호를 재설정하세요.');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('   💡 네트워크 오류: 인터넷 연결 또는 MongoDB Atlas 클러스터 상태를 확인하세요.');
    } else if (error.message.includes('timeout')) {
      console.error('   💡 타임아웃: MongoDB 서버가 응답하지 않습니다.');
      console.error('   💡 MongoDB Atlas IP 화이트리스트에 현재 IP가 추가되어 있는지 확인하세요.');
      console.error('   💡 MongoDB Atlas 콘솔 > Network Access에서 0.0.0.0/0 (모든 IP 허용) 추가');
    }
    
    // 재시도 로직
    if (retryCount < MAX_RETRIES) {
      console.log(`   🔄 ${RETRY_DELAY / 1000}초 후 재시도합니다... (${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => {
        connectDB(retryCount + 1);
      }, RETRY_DELAY);
    } else {
      console.error('   ❌ 최대 재시도 횟수에 도달했습니다.');
      console.log('   ⚠️  Server will continue running without MongoDB connection.\n');
      // MongoDB 연결 실패해도 서버는 계속 실행
    }
  }
};

module.exports = connectDB;
