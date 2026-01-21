const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT 토큰 검증 미들웨어
 * 보호된 라우트에서 사용
 */
const authenticate = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 제공되지 않았습니다.',
      });
    }

    // "Bearer " 제거하고 토큰만 추출
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 제공되지 않았습니다.',
      });
    }

    // 토큰 검증
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(
      token,
      jwtSecret
    );

    // 사용자 정보 조회 (비밀번호 제외)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    // req.user에 사용자 정보 추가
    req.user = user;
    next();
  } catch (error) {
    console.error('인증 오류:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
      });
    }

    res.status(401).json({
      success: false,
      message: '인증에 실패했습니다.',
      error: error.message,
    });
  }
};

module.exports = authenticate;
