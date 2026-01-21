const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  getProductByNumber,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

/**
 * GET /api/products
 * 모든 상품 조회 (페이징, 검색, 필터링 지원)
 */
router.get('/', getAllProducts);

/**
 * GET /api/products/number/:productNumber
 * 상품번호로 상품 조회
 * 주의: 이 라우트는 /:id 라우트보다 먼저 정의되어야 합니다
 */
router.get('/number/:productNumber', getProductByNumber);

/**
 * GET /api/products/:id
 * 특정 상품 조회 (ID로)
 */
router.get('/:id', getProductById);

/**
 * POST /api/products
 * 새 상품 생성
 */
router.post('/', createProduct);

/**
 * PUT /api/products/:id
 * 상품 정보 업데이트
 */
router.put('/:id', updateProduct);

/**
 * DELETE /api/products/:id
 * 상품 삭제
 */
router.delete('/:id', deleteProduct);

module.exports = router;
