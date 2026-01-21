const Product = require('../models/Product');

/**
 * 모든 상품 조회 (페이징, 검색, 필터링 지원)
 * GET /api/products
 */
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
    } = req.query;

    // 검색 조건 구성
    const query = {};
    
    // 상품번호 또는 상품명으로 검색
    if (search) {
      query.$or = [
        { productNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    // 카테고리 필터
    if (category && ['카메라', '렌즈'].includes(category)) {
      query.category = category;
    }

    // 페이징 계산
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // 상품 조회
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 전체 개수 조회
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
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
      message: '상품 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 특정 상품 조회 (ID로)
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다.',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    console.log('[getProductById] 조회된 상품 데이터:', product.toObject());
    console.log('[getProductById] product.price:', product.price, '타입:', typeof product.price);

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 상품번호로 상품 조회
 * GET /api/products/number/:productNumber
 */
const getProductByNumber = async (req, res) => {
  try {
    const { productNumber } = req.params;

    const product = await Product.findOne({ 
      productNumber: productNumber.toUpperCase().trim() 
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 새 상품 생성
 * POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    const { productNumber, name, image, category, price, description } = req.body;

    console.log('상품 등록 요청 받음:', { productNumber, name, category, price });

    // 필수 필드 검증
    if (!productNumber || !name || !image || !category || price === undefined || price === null || price === '') {
      return res.status(400).json({
        success: false,
        message: '상품번호, 상품명, 상품이미지, 카테고리, 가격은 필수입니다.',
      });
    }

    // 카테고리 검증
    if (!['카메라', '렌즈'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: '카테고리는 카메라 또는 렌즈여야 합니다.',
      });
    }

    // 가격 검증
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: '가격은 0 이상의 숫자여야 합니다.',
      });
    }

    // 새 상품 생성
    const product = new Product({
      productNumber: productNumber.trim().toUpperCase(),
      name: name.trim(),
      image: image.trim(),
      category,
      price: priceNum,
      description: description ? description.trim() : undefined,
    });

    console.log('[createProduct] 저장 전 product 객체:', product.toObject());
    console.log('[createProduct] price 값:', priceNum, '타입:', typeof priceNum);

    // 상품 저장
    const savedProduct = await product.save();
    
    console.log('[createProduct] 저장 후 savedProduct 객체:', savedProduct.toObject());
    console.log('[createProduct] savedProduct.price:', savedProduct.price, '타입:', typeof savedProduct.price);
    console.log('상품 생성 성공:', savedProduct.productNumber);

    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 등록되었습니다.',
      data: savedProduct,
    });
  } catch (error) {
    console.error('상품 등록 오류:', error);

    // 중복 상품번호 에러 처리
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 상품번호입니다.',
      });
    }

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
      message: '상품 등록 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 상품 정보 업데이트
 * PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { productNumber, name, image, category, price, description } = req.body;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다.',
      });
    }

    // 업데이트할 데이터 구성
    const updateData = {};
    if (productNumber !== undefined) {
      updateData.productNumber = productNumber.trim().toUpperCase();
    }
    if (name !== undefined) updateData.name = name.trim();
    if (image !== undefined) updateData.image = image.trim();
    if (category !== undefined) {
      if (!['카메라', '렌즈'].includes(category)) {
        return res.status(400).json({
          success: false,
          message: '카테고리는 카메라 또는 렌즈여야 합니다.',
        });
      }
      updateData.category = category;
    }
    if (price !== undefined && price !== null && price !== '') {
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({
          success: false,
          message: '가격은 0 이상의 숫자여야 합니다.',
        });
      }
      updateData.price = priceNum;
    }
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    // 상품 업데이트
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    console.log('상품 업데이트 성공:', updatedProduct.productNumber);

    res.json({
      success: true,
      message: '상품 정보가 성공적으로 업데이트되었습니다.',
      data: updatedProduct,
    });
  } catch (error) {
    console.error('상품 업데이트 오류:', error);

    // 중복 상품번호 에러 처리
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 상품번호입니다.',
      });
    }

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
      message: '상품 업데이트 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

/**
 * 상품 삭제
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다.',
      });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    console.log('상품 삭제 성공:', deletedProduct.productNumber);

    res.json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.',
      data: deletedProduct,
    });
  } catch (error) {
    console.error('상품 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 삭제 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductByNumber,
  createProduct,
  updateProduct,
  deleteProduct,
};
