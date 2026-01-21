const express = require('express');
const router = express.Router();
const checkDB = require('../middleware/checkDB');

// 예시 라우트
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// MongoDB 연결 상태 확인 미들웨어 적용 (테스트 라우트 제외)
router.use(checkDB);

// 라우트 설정
router.use('/users', require('./users'));
router.use('/auth', require('./auth'));
router.use('/products', require('./products'));
router.use('/cart', require('./cart'));
router.use('/orders', require('./orders')); // 주문 라우트 추가

module.exports = router;
