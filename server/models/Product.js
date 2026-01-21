const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productNumber: {
      type: String,
      required: [true, '상품번호는 필수입니다.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, '상품명은 필수입니다.'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, '상품 이미지는 필수입니다.'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, '카테고리는 필수입니다.'],
      enum: {
        values: ['카메라', '렌즈'],
        message: '카테고리는 카메라 또는 렌즈여야 합니다.',
      },
    },
    price: {
      type: Number,
      required: [true, '가격은 필수입니다.'],
      min: [0, '가격은 0 이상이어야 합니다.'],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
