const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * 로그인
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('로그인 요청 받음:', { email });

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    // 이메일로 사용자 조회 (비밀번호 포함)
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // 사용자가 존재하지 않거나 비밀번호가 틀린 경우 동일한 메시지 반환 (보안)
    if (!user) {
      console.log('사용자를 찾을 수 없음:', email);
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('비밀번호 불일치:', email);
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // JWT 토큰 생성
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      userType: user.userType,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: '1h', // 1시간 유효
      }
    );

    console.log('로그인 성공:', user.email);
    console.log('토큰 발급 완료 - 만료 시간: 1시간');

    // 사용자 정보 (비밀번호 제외)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: '로그인에 성공했습니다.',
      token, // JWT 토큰 발급
      tokenType: 'Bearer', // 토큰 타입 명시
      expiresIn: '1h', // 토큰 만료 시간
      data: userResponse,
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 현재 로그인한 사용자 정보 조회
 * GET /api/auth/me
 * 인증 필요: Authorization 헤더에 Bearer 토큰 필요
 */
const getMe = async (req, res) => {
  try {
    // 미들웨어에서 req.user에 사용자 정보가 추가됨
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '인증되지 않은 사용자입니다.',
      });
    }

    console.log('사용자 정보 조회 성공:', user.email);

    // 사용자 정보를 객체로 변환 (Mongoose 문서를 일반 객체로)
    const userResponse = user.toObject ? user.toObject() : user;

    res.json({
      success: true,
      message: '사용자 정보를 성공적으로 조회했습니다.',
      data: userResponse,
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  login,
  getMe,
};
