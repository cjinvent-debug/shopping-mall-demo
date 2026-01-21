const mongoose = require('mongoose');

/**
 * MongoDB 연결 상태를 확인하는 미들웨어
 * 연결이 안 되어 있으면 503 에러 반환
 */
const checkDB = (req, res, next) => {
  const readyState = mongoose.connection.readyState;
  
  if (readyState !== 1) {
    const stateMessages = {
      0: 'MongoDB 연결이 끊어졌습니다',
      2: 'MongoDB 연결 중입니다. 잠시 후 다시 시도해주세요',
      3: 'MongoDB 연결 해제 중입니다'
    };
    
    return res.status(503).json({
      success: false,
      message: stateMessages[readyState] || '서버에 연결할 수 없습니다. 서버가 포트 5000에서 실행 중인지 확인해주세요.',
      error: 'MongoDB connection not established',
      dbStatus: readyState,
      dbStateMessage: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      }[readyState] || 'unknown'
    });
  }
  next();
};

module.exports = checkDB;
