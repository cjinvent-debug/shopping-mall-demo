const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');

/**
 * GET /api/cart
 * 사용자의 장바구니 조회
 * 인증 필요
 */
router.get('/', authenticate, getCart);

/**
 * POST /api/cart
 * 장바구니에 상품 추가
 * 인증 필요
 * body: { productId, quantity }
 */
router.post('/', authenticate, addToCart);

/**
 * PUT /api/cart/:id
 * 장바구니 항목 수량 수정
 * 인증 필요
 * body: { quantity }
 */
router.put('/:id', authenticate, updateCartItem);

/**
 * DELETE /api/cart/:id
 * 장바구니 항목 삭제
 * 인증 필요
 * 주의: 이 라우트는 DELETE /api/cart보다 먼저 정의되어야 합니다
 */
router.delete('/:id', authenticate, removeFromCart);

/**
 * DELETE /api/cart
 * 장바구니 전체 비우기
 * 인증 필요
 * 주의: 이 라우트는 DELETE /api/cart/:id보다 나중에 정의되어야 합니다
 */
router.delete('/', authenticate, clearCart);

module.exports = router;
