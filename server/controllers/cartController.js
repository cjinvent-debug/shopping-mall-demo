const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * 사용자의 장바구니 조회
 * GET /api/cart
 * 인증 필요
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // 사용자의 장바구니 조회 (상품 정보 포함)
    const cartItems = await Cart.find({ user: userId })
      .populate('product', 'name image price category')
      .sort({ createdAt: -1 }); // 최신순 정렬

    res.json({
      success: true,
      message: '장바구니를 성공적으로 조회했습니다.',
      data: cartItems,
    });
  } catch (error) {
    console.error('장바구니 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 장바구니에 상품 추가
 * POST /api/cart
 * 인증 필요
 * body: { productId, quantity }
 */
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    // 필수 필드 검증
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID는 필수입니다.',
      });
    }

    // 수량 검증
    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      return res.status(400).json({
        success: false,
        message: '수량은 1 이상의 숫자여야 합니다.',
      });
    }

    // 상품 존재 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    // 이미 장바구니에 있는 상품인지 확인
    const existingCartItem = await Cart.findOne({
      user: userId,
      product: productId,
    });

    if (existingCartItem) {
      // 이미 있으면 수량 업데이트
      existingCartItem.quantity += quantityNum;
      await existingCartItem.save();

      return res.json({
        success: true,
        message: '장바구니에 상품이 추가되었습니다. (기존 항목 수량 증가)',
        data: existingCartItem,
      });
    }

    // 새로 장바구니에 추가
    const cartItem = new Cart({
      user: userId,
      product: productId,
      quantity: quantityNum,
    });

    await cartItem.save();

    // 상품 정보 포함하여 응답
    const populatedCartItem = await Cart.findById(cartItem._id).populate(
      'product',
      'name image price category'
    );

    res.status(201).json({
      success: true,
      message: '장바구니에 상품이 추가되었습니다.',
      data: populatedCartItem,
    });
  } catch (error) {
    console.error('장바구니 추가 오류:', error);

    // 중복 에러 처리
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 장바구니에 추가된 상품입니다.',
      });
    }

    res.status(500).json({
      success: false,
      message: '장바구니 추가 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 장바구니 항목 수량 수정
 * PUT /api/cart/:id
 * 인증 필요
 * body: { quantity }
 */
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { quantity } = req.body;

    // 수량 검증
    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      return res.status(400).json({
        success: false,
        message: '수량은 1 이상의 숫자여야 합니다.',
      });
    }

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 장바구니 ID입니다.',
      });
    }

    // 장바구니 항목 조회 및 소유권 확인
    const cartItem = await Cart.findOne({
      _id: id,
      user: userId,
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: '장바구니 항목을 찾을 수 없습니다.',
      });
    }

    // 수량 업데이트
    cartItem.quantity = quantityNum;
    await cartItem.save();

    // 상품 정보 포함하여 응답
    const populatedCartItem = await Cart.findById(cartItem._id).populate(
      'product',
      'name image price category'
    );

    res.json({
      success: true,
      message: '장바구니 항목이 수정되었습니다.',
      data: populatedCartItem,
    });
  } catch (error) {
    console.error('장바구니 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 수정 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 장바구니 항목 삭제
 * DELETE /api/cart/:id
 * 인증 필요
 */
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 장바구니 ID입니다.',
      });
    }

    // 장바구니 항목 조회 및 소유권 확인
    const cartItem = await Cart.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: '장바구니 항목을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '장바구니에서 상품이 제거되었습니다.',
      data: cartItem,
    });
  } catch (error) {
    console.error('장바구니 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 삭제 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 장바구니 전체 비우기
 * DELETE /api/cart
 * 인증 필요
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Cart.deleteMany({ user: userId });

    res.json({
      success: true,
      message: '장바구니가 비워졌습니다.',
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    console.error('장바구니 비우기 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 비우기 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
