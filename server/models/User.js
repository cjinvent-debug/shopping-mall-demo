const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, '이메일은 필수입니다.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, '유효한 이메일 형식이 아닙니다.'],
    },
    name: {
      type: String,
      required: [true, '이름은 필수입니다.'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다.'],
      minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.'],
    },
    userType: {
      type: String,
      required: [true, '사용자 유형은 필수입니다.'],
      enum: {
        values: ['CUSTOMER', 'ADMIN'],
        message: '사용자 유형은 CUSTOMER 또는 ADMIN이어야 합니다.',
      },
      default: 'CUSTOMER',
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// unique: true가 이미 인덱스를 생성하므로 별도 인덱스 선언 제거

const User = mongoose.model('User', userSchema);

module.exports = User;
