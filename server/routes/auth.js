const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const authenticate = require('../middleware/auth');

/**
 * POST /api/auth/login
 * 로그인
 */
router.post('/login', login);

/**
 * GET /api/auth/me
 * 현재 로그인한 사용자 정보 조회
 * 인증 필요
 */
router.get('/me', authenticate, getMe);

module.exports = router;
