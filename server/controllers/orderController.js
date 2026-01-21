const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const axios = require('axios');

/**
 * 포트원 API 토큰 발급
 */
const getIamportToken = async () => {
  try {
    const impKey = process.env.IMP_KEY || process.env.IAMPORT_KEY;
    const impSecret = process.env.IMP_SECRET || process.env.IAMPORT_SECRET;

    if (!impKey || !impSecret) {
      throw new Error('포트원 API 키가 설정되지 않았습니다. IMP_KEY와 IMP_SECRET 환경변수를 확인해주세요.');
    }

    const response = await axios.post('https://api.iamport.kr/users/getToken', {
      imp_key: impKey,
      imp_secret: impSecret,
    });

    if (response.data.code === 0) {
      return response.data.response.access_token;
    } else {
      throw new Error(`포트원 토큰 발급 실패: ${response.data.message}`);
    }
  } catch (error) {
    console.error('포트원 토큰 발급 오류:', error);
    throw error;
  }
};

/**
 * 포트원 결제 검증
 * @param {string} imp_uid - 포트원 결제 고유번호
 * @param {number} expectedAmount - 예상 결제 금액
 * @returns {Object} 결제 정보
 */
const verifyPayment = async (imp_uid, expectedAmount) => {
  try {
    const accessToken = await getIamportToken();

    const response = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.code !== 0) {
      throw new Error(`결제 조회 실패: ${response.data.message}`);
    }

    const paymentData = response.data.response;

    // 결제 상태 확인
    if (paymentData.status !== 'paid') {
      throw new Error(`결제가 완료되지 않았습니다. 상태: ${paymentData.status}`);
    }

    // 결제 금액 검증
    if (paymentData.amount !== expectedAmount) {
      throw new Error(
        `결제 금액이 일치하지 않습니다. 예상: ${expectedAmount}원, 실제: ${paymentData.amount}원`
      );
    }

    return paymentData;
  } catch (error) {
    console.error('포트원 결제 검증 오류:', error);
    throw error;
  }
};

/**
 * 주문 중복 체크
 * @param {string} merchant_uid - 주문 고유번호
 * @returns {boolean} 중복 여부
 */
const checkDuplicateOrder = async (merchant_uid) => {
  try {
    // payment.merchant_uid로 이미 주문이 생성되었는지 확인
    const existingOrder = await Order.findOne({
      'payment.merchant_uid': merchant_uid,
    });

    if (existingOrder) {
      return true; // 중복 주문 존재
    }

    return false; // 중복 없음
  } catch (error) {
    console.error('주문 중복 체크 오류:', error);
    throw error;
  }
};

/**
 * 주문 번호 생성 (예: ORD-20240101-0001)
 */
const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // 오늘 날짜로 시작하는 주문번호 중 마지막 번호 찾기
  return Order.findOne({ orderNumber: new RegExp(`^ORD-${dateStr}-`) })
    .sort({ orderNumber: -1 })
    .then((lastOrder) => {
      let sequence = 1;
      if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2] || '0');
        sequence = lastSequence + 1;
      }
      const sequenceStr = String(sequence).padStart(4, '0');
      return `ORD-${dateStr}-${sequenceStr}`;
    });
};

/**
 * 주문 목록 조회
 * GET /api/orders
 * 인증 필요
 * - 일반 사용자: 본인 주문만 조회
 * - 관리자: 전체 주문 조회
 */
const getOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.userType;
    const { status } = req.query; // 쿼리 파라미터로 상태 필터링

    // 조회 조건 설정
    const query = {};
    
    // 일반 사용자는 본인 주문만, 관리자는 전체 주문
    if (userType !== 'ADMIN') {
      query.user = userId;
    }
    
    // 상태 필터링
    if (status) {
      query.status = status;
    }

    // 주문 조회 (상품 정보 포함)
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name image price category productNumber')
      .sort({ createdAt: -1 }); // 최신순 정렬

    res.json({
      success: true,
      message: '주문 목록을 성공적으로 조회했습니다.',
      data: orders,
    });
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 특정 주문 조회
 * GET /api/orders/:id
 * 인증 필요
 * - 일반 사용자: 본인 주문만 조회 가능
 * - 관리자: 모든 주문 조회 가능
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userType = req.user.userType;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 주문 ID입니다.',
      });
    }

    // 주문 조회
    const order = await Order.findById(id)
      .populate('user', 'name email address')
      .populate('items.product', 'name image price category productNumber description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 권한 확인: 일반 사용자는 본인 주문만 조회 가능
    if (userType !== 'ADMIN' && order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '주문 조회 권한이 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '주문을 성공적으로 조회했습니다.',
      data: order,
    });
  } catch (error) {
    console.error('주문 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 주문 생성 (장바구니 기반)
 * POST /api/orders
 * 인증 필요
 * body: {
 *   shippingInfo: { recipientName, recipientPhone, shippingAddress, shippingMemo },
 *   payment: { method, imp_uid, merchant_uid },
 *   orderMemo
 * }
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingInfo, payment, orderMemo } = req.body;

    // 배송 정보 검증
    if (!shippingInfo || !shippingInfo.recipientName || !shippingInfo.recipientPhone || !shippingInfo.shippingAddress) {
      return res.status(400).json({
        success: false,
        message: '수령인 이름, 전화번호, 배송 주소는 필수입니다.',
      });
    }

    // 결제 정보 검증 (포트원 결제인 경우)
    if (payment?.imp_uid && payment?.merchant_uid) {
      // 주문 중복 체크
      const isDuplicate = await checkDuplicateOrder(payment.merchant_uid);
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          message: '이미 처리된 주문입니다. 중복 주문을 방지했습니다.',
        });
      }
    }

    // 장바구니에서 상품 가져오기
    const cartItems = await Cart.find({ user: userId }).populate('product');
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '장바구니가 비어있습니다.',
      });
    }

    // 주문 항목 생성
    const items = cartItems.map((cartItem) => ({
      product: cartItem.product._id,
      quantity: cartItem.quantity,
    }));

    // 주문 금액 계산
    const itemsTotal = cartItems.reduce(
      (sum, cartItem) => sum + (cartItem.product.price || 0) * cartItem.quantity,
      0
    );

    // 배송비 계산 (30,000원 이상 무료, 아니면 3,000원)
    const shippingFee = itemsTotal >= 30000 ? 0 : 3000;
    const discount = 0; // 할인 기능은 추후 구현
    const finalTotal = itemsTotal + shippingFee - discount;

    // 포트원 결제 검증 (imp_uid가 있는 경우)
    let paymentStatus = 'PENDING';
    let verifiedPaymentData = null;

    if (payment?.imp_uid) {
      try {
        // 결제 검증
        verifiedPaymentData = await verifyPayment(payment.imp_uid, finalTotal);
        paymentStatus = 'COMPLETED';
        console.log('포트원 결제 검증 성공:', {
          imp_uid: payment.imp_uid,
          merchant_uid: payment.merchant_uid,
          amount: verifiedPaymentData.amount,
        });
      } catch (paymentError) {
        console.error('포트원 결제 검증 실패:', paymentError);
        return res.status(400).json({
          success: false,
          message: `결제 검증에 실패했습니다: ${paymentError.message}`,
        });
      }
    }

    // 주문 번호 생성
    const orderNumber = await generateOrderNumber();

    // 주문 생성
    const order = new Order({
      orderNumber,
      user: userId,
      items,
      shippingInfo: {
        recipientName: shippingInfo.recipientName.trim(),
        recipientPhone: shippingInfo.recipientPhone.trim(),
        shippingAddress: shippingInfo.shippingAddress.trim(),
        shippingMemo: shippingInfo.shippingMemo ? shippingInfo.shippingMemo.trim() : undefined,
      },
      amount: {
        itemsTotal,
        shippingFee,
        discount,
        finalTotal,
      },
      status: paymentStatus === 'COMPLETED' ? 'PAYMENT_COMPLETED' : 'PENDING',
      payment: {
        method: payment?.method || undefined,
        status: paymentStatus,
        imp_uid: payment?.imp_uid || undefined,
        merchant_uid: payment?.merchant_uid || undefined,
        paidAt: paymentStatus === 'COMPLETED' ? new Date() : undefined,
      },
      orderMemo: orderMemo ? orderMemo.trim() : undefined,
    });

    const savedOrder = await order.save();

    // 주문 생성 후 장바구니 비우기
    await Cart.deleteMany({ user: userId });

    // 주문 정보 반환 (상품 정보 포함)
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('user', 'name email')
      .populate('items.product', 'name image price category productNumber');

    console.log('주문 생성 성공:', {
      orderNumber: savedOrder.orderNumber,
      merchant_uid: payment?.merchant_uid,
      paymentStatus,
    });

    res.status(201).json({
      success: true,
      message: '주문이 성공적으로 생성되었습니다.',
      data: populatedOrder,
    });
  } catch (error) {
    console.error('주문 생성 오류:', error);

    // Mongoose 검증 에러 처리
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: '입력 데이터 검증 실패',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: '주문 생성 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 주문 수정 (주문 상태, 관리자 메모 등)
 * PUT /api/orders/:id
 * 인증 필요
 * - 일반 사용자: 취소만 가능 (CANCELLED로 변경)
 * - 관리자: 모든 필드 수정 가능
 */
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userType = req.user.userType;
    const { status, payment, adminMemo, orderMemo } = req.body;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 주문 ID입니다.',
      });
    }

    // 주문 조회
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 권한 확인
    const isOwner = order.user.toString() === userId.toString();
    const isAdmin = userType === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: '주문 수정 권한이 없습니다.',
      });
    }

    // 업데이트할 데이터 구성
    const updateData = {};

    // 주문 상태 변경
    if (status !== undefined) {
      if (isAdmin) {
        // 관리자는 모든 상태 변경 가능
        const validStatuses = ['PENDING', 'PAYMENT_COMPLETED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: '유효하지 않은 주문 상태입니다.',
          });
        }
        updateData.status = status;
      } else if (isOwner) {
        // 일반 사용자는 취소만 가능 (PENDING 상태일 때만)
        if (status === 'CANCELLED' && order.status === 'PENDING') {
          updateData.status = 'CANCELLED';
        } else if (status === 'CANCELLED') {
          return res.status(400).json({
            success: false,
            message: '주문 대기 상태에서만 취소할 수 있습니다.',
          });
        } else {
          return res.status(403).json({
            success: false,
            message: '주문 상태를 변경할 권한이 없습니다.',
          });
        }
      }
    }

    // 결제 정보 업데이트 (관리자만)
    if (payment !== undefined && isAdmin) {
      if (payment.status !== undefined) {
        updateData['payment.status'] = payment.status;
        if (payment.status === 'COMPLETED') {
          updateData['payment.paidAt'] = new Date();
        }
      }
      if (payment.method !== undefined) {
        updateData['payment.method'] = payment.method;
      }
    }

    // 관리자 메모 (관리자만)
    if (adminMemo !== undefined && isAdmin) {
      updateData.adminMemo = adminMemo.trim();
    }

    // 주문 메모 (주문자만)
    if (orderMemo !== undefined && isOwner) {
      updateData.orderMemo = orderMemo.trim();
    }

    // 주문 업데이트
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('items.product', 'name image price category productNumber');

    console.log('주문 업데이트 성공:', updatedOrder.orderNumber);

    res.json({
      success: true,
      message: '주문 정보가 성공적으로 업데이트되었습니다.',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('주문 업데이트 오류:', error);

    // Mongoose 검증 에러 처리
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: '입력 데이터 검증 실패',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: '주문 업데이트 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 주문 삭제 (또는 취소)
 * DELETE /api/orders/:id
 * 인증 필요
 * - 일반 사용자: 본인 주문만 취소 가능 (PENDING 상태일 때만)
 * - 관리자: 모든 주문 삭제 가능
 */
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userType = req.user.userType;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 주문 ID입니다.',
      });
    }

    // 주문 조회
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 권한 확인
    const isOwner = order.user.toString() === userId.toString();
    const isAdmin = userType === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: '주문 삭제 권한이 없습니다.',
      });
    }

    // 일반 사용자는 PENDING 상태일 때만 취소 가능
    if (!isAdmin && order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: '주문 대기 상태에서만 취소할 수 있습니다.',
      });
    }

    // 주문 삭제 (또는 상태를 CANCELLED로 변경)
    if (isAdmin) {
      // 관리자는 완전 삭제 가능
      await Order.findByIdAndDelete(id);
    } else {
      // 일반 사용자는 취소 상태로 변경
      order.status = 'CANCELLED';
      await order.save();
    }

    console.log('주문 삭제/취소 성공:', order.orderNumber);

    res.json({
      success: true,
      message: isAdmin ? '주문이 성공적으로 삭제되었습니다.' : '주문이 성공적으로 취소되었습니다.',
    });
  } catch (error) {
    console.error('주문 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 삭제 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};