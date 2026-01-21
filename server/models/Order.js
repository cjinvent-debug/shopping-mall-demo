const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // 주문 번호 (고유 번호, 예: ORD-20240101-0001)
    orderNumber: {
      type: String,
      required: [true, '주문번호는 필수입니다.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    
    // 주문자 정보
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자 ID는 필수입니다.'],
      index: true,
    },

    // 주문 상품 목록 (배열)
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: [true, '수량은 필수입니다.'],
          min: [1, '수량은 최소 1개 이상이어야 합니다.'],
        },
      },
    ],

    // 배송 정보
    shippingInfo: {
      recipientName: {
        type: String,
        required: [true, '수령인 이름은 필수입니다.'],
        trim: true,
      },
      recipientPhone: {
        type: String,
        required: [true, '수령인 전화번호는 필수입니다.'],
        trim: true,
      },
      shippingAddress: {
        type: String,
        required: [true, '배송 주소는 필수입니다.'],
        trim: true,
      },
      shippingMemo: {
        type: String,
        trim: true,
      },
    },

    // 주문 금액 정보
    amount: {
      itemsTotal: {
        type: Number,
        required: [true, '상품 총액은 필수입니다.'],
        min: [0, '상품 총액은 0 이상이어야 합니다.'],
      },
      shippingFee: {
        type: Number,
        required: [true, '배송비는 필수입니다.'],
        min: [0, '배송비는 0 이상이어야 합니다.'],
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: [0, '할인 금액은 0 이상이어야 합니다.'],
      },
      finalTotal: {
        type: Number,
        required: [true, '최종 결제 금액은 필수입니다.'],
        min: [0, '최종 결제 금액은 0 이상이어야 합니다.'],
      },
    },

    // 주문 상태
    status: {
      type: String,
      required: [true, '주문 상태는 필수입니다.'],
      enum: {
        values: [
          'PENDING',           // 주문 대기 (주문 생성 직후)
          'PAYMENT_COMPLETED', // 결제 완료
          'PREPARING',         // 배송 준비 중
          'SHIPPING',          // 배송 중
          'DELIVERED',         // 배송 완료
          'CANCELLED',         // 주문 취소
        ],
        message: '유효하지 않은 주문 상태입니다.',
      },
      default: 'PENDING',
      index: true,
    },

    // 결제 정보
    payment: {
      method: {
        type: String,
        enum: {
          values: ['CARD', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'MOBILE'],
          message: '유효하지 않은 결제 방법입니다.',
        },
      },
      status: {
        type: String,
        enum: {
          values: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
          message: '유효하지 않은 결제 상태입니다.',
        },
        default: 'PENDING',
      },
      imp_uid: {
        type: String,
        trim: true,
        index: true, // 포트원 결제 고유번호로 조회를 위한 인덱스
      },
      merchant_uid: {
        type: String,
        trim: true,
        unique: true,
        sparse: true, // null 값은 중복 허용
        index: true, // 중복 주문 체크를 위한 인덱스
      },
      paidAt: {
        type: Date,
      },
    },

    // 주문 메모 (고객이 주문 시 남기는 메모)
    orderMemo: {
      type: String,
      trim: true,
    },

    // 관리자 메모 (관리자가 관리용으로 남기는 메모)
    adminMemo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 사용자별 주문 조회를 위한 인덱스
orderSchema.index({ user: 1, createdAt: -1 });

// 주문 상태별 조회를 위한 인덱스
orderSchema.index({ status: 1, createdAt: -1 });

// orderNumber는 unique: true로 이미 인덱스가 생성되므로 별도 인덱스 불필요

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;