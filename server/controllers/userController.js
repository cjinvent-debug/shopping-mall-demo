const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * 모든 사용자 조회 (페이징, 검색, 필터링 지원)
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      userType = '',
    } = req.query;

    // 검색 조건 구성
    const query = {};
    
    // 이름 또는 이메일로 검색
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // 사용자 타입 필터
    if (userType && ['CUSTOMER', 'ADMIN'].includes(userType.toUpperCase())) {
      query.userType = userType.toUpperCase();
    }

    // 페이징 계산
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // 사용자 조회
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 전체 개수 조회
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 특정 사용자 조회 (ID로)
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 사용자 ID입니다.',
      });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 이메일로 사용자 조회
 * GET /api/users/email/:email
 */
const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email: email.toLowerCase() }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 새 사용자 생성
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { email, name, password, userType, address } = req.body;

    console.log('회원가입 요청 받음:', { email, name, userType });

    // 필수 필드 검증
    if (!email || !name || !password) {
      console.log('필수 필드 누락');
      return res.status(400).json({
        success: false,
        message: '이메일, 이름, 비밀번호는 필수입니다.',
      });
    }

    // 사용자 타입 검증
    if (userType && !['CUSTOMER', 'ADMIN'].includes(userType.toUpperCase())) {
      console.log('잘못된 사용자 타입:', userType);
      return res.status(400).json({
        success: false,
        message: '사용자 유형은 CUSTOMER 또는 ADMIN이어야 합니다.',
      });
    }

    // 비밀번호 해시화 (salt rounds: 10)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('비밀번호 해시화 완료');

    // 새 사용자 생성
    const user = new User({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password: hashedPassword, // 해시화된 비밀번호 저장
      userType: userType ? userType.toUpperCase() : 'CUSTOMER',
      address: address ? address.trim() : undefined,
    });

    // 사용자 저장
    const savedUser = await user.save();
    console.log('사용자 생성 성공:', savedUser.email);

    const userResponse = savedUser.toObject();
    delete userResponse.password; // 비밀번호 제외

    res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 생성되었습니다.',
      data: userResponse,
    });
  } catch (error) {
    console.error('회원가입 오류:', error);

    // 중복 이메일 에러 처리
    if (error.code === 11000) {
      console.log('중복 이메일:', error.keyValue);
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 이메일입니다.',
      });
    }

    // Mongoose 검증 에러 처리
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      console.log('검증 오류:', errors);
      return res.status(400).json({
        success: false,
        message: '입력 데이터 검증 실패',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: '사용자 생성 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 사용자 정보 업데이트
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, userType, address } = req.body;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 사용자 ID입니다.',
      });
    }

    // 업데이트할 데이터 구성
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    
    // 비밀번호가 제공된 경우 해시화
    if (password !== undefined) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
      console.log('비밀번호 업데이트 - 해시화 완료');
    }
    
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (userType !== undefined) {
      if (!['CUSTOMER', 'ADMIN'].includes(userType.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: '사용자 유형은 CUSTOMER 또는 ADMIN이어야 합니다.',
        });
      }
      updateData.userType = userType.toUpperCase();
    }

    // 사용자 업데이트
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // 업데이트된 문서 반환
        runValidators: true, // 스키마 검증 실행
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 업데이트되었습니다.',
      data: user,
    });
  } catch (error) {
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
      message: '사용자 업데이트 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 사용자 삭제
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 사용자 ID입니다.',
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 삭제 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
};
