const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

/**
 * GET /api/users
 * 모든 사용자 조회 (페이징, 검색, 필터링 지원)
 */
router.get('/', getAllUsers);

/**
 * GET /api/users/email/:email
 * 이메일로 사용자 조회
 * 주의: 이 라우트는 /:id 라우트보다 먼저 정의되어야 합니다
 */
router.get('/email/:email', getUserByEmail);

/**
 * GET /api/users/:id
 * 특정 사용자 조회 (ID로)
 */
router.get('/:id', getUserById);

/**
 * POST /api/users
 * 새 사용자 생성
 */
router.post('/', createUser);

/**
 * PUT /api/users/:id
 * 사용자 정보 업데이트
 */
router.put('/:id', updateUser);

/**
 * DELETE /api/users/:id
 * 사용자 삭제
 */
router.delete('/:id', deleteUser);

module.exports = router;
