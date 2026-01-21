const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../controllers/orderController');

/**
 * GET /api/orders
 * 주문 목록 조회
 * 인증 필요
 * - 일반 사용자: 본인 주문만 조회
 * - 관리자: 전체 주문 조회
 * 쿼리 파라미터: ?status=PENDING (상태별 필터링)
 */
router.get('/', authenticate, getOrders);

/**
 * GET /api/orders/:id
 * 특정 주문 조회
 * 인증 필요
 * - 일반 사용자: 본인 주문만 조회 가능
 * - 관리자: 모든 주문 조회 가능
 */
router.get('/:id', authenticate, getOrderById);

/**
 * POST /api/orders
 * 주문 생성 (장바구니 기반)
 * 인증 필요
 * body: {
 *   shippingInfo: { recipientName, recipientPhone, shippingAddress, shippingMemo },
 *   payment: { method },
 *   orderMemo
 * }
 */
router.post('/', authenticate, createOrder);

/**
 * PUT /api/orders/:id
 * 주문 수정 (주문 상태, 관리자 메모 등)
 * 인증 필요
 * - 일반 사용자: 취소만 가능 (PENDING 상태일 때만)
 * - 관리자: 모든 필드 수정 가능
 */
router.put('/:id', authenticate, updateOrder);

/**
 * DELETE /api/orders/:id
 * 주문 삭제 (또는 취소)
 * 인증 필요
 * - 일반 사용자: 본인 주문만 취소 가능 (PENDING 상태일 때만)
 * - 관리자: 모든 주문 삭제 가능
 */
router.delete('/:id', authenticate, deleteOrder);

module.exports = router;