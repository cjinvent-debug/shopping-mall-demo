import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './AdminProductNew.css'

function AdminProductNew() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, loading } = useUser()
  const isEditMode = !!id
  const [formData, setFormData] = useState({
    productNumber: '',
    name: '',
    image: '',
    category: '',
    price: '',
    description: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [imagePreview, setImagePreview] = useState('')

  // Admin 권한 체크
  useEffect(() => {
    if (!loading && (!user || user.userType !== 'ADMIN')) {
      navigate('/')
    }
  }, [loading, user, navigate])

  // 수정 모드일 때 상품 데이터 불러오기
  useEffect(() => {
    if (isEditMode && user && user.userType === 'ADMIN') {
      fetchProduct()
    }
  }, [isEditMode, id, user])

  const fetchProduct = async () => {
    try {
      setIsLoadingProduct(true)
      const response = await axios.get(`${API_BASE_URL}/api/products/${id}`)
      if (response.data.success) {
        const product = response.data.data
        
        // 디버깅: 실제 서버에서 받은 데이터 확인
        console.log('[fetchProduct] 서버에서 받은 상품 데이터:', product)
        console.log('[fetchProduct] product.price 값:', product.price, '타입:', typeof product.price)
        
        // 가격 처리: 숫자면 문자열로 변환, 없으면 빈 문자열
        let priceValue = ''
        if (product.price !== undefined && product.price !== null) {
          const priceNum = Number(product.price)
          console.log('[fetchProduct] priceNum 변환 후:', priceNum, 'isNaN:', isNaN(priceNum), '> 0:', priceNum > 0)
          
          if (!isNaN(priceNum) && priceNum >= 0) {
            // 숫자이면 문자열로 변환 (0 이상이면 저장)
            priceValue = String(priceNum)
            console.log('[fetchProduct] 최종 priceValue:', priceValue)
          } else {
            console.log('[fetchProduct] 가격 변환 실패 - priceNum:', priceNum)
          }
        } else {
          console.log('[fetchProduct] product.price가 undefined 또는 null')
        }
        
        const formDataToSet = {
          productNumber: product.productNumber || '',
          name: product.name || '',
          image: product.image || '',
          category: product.category || '',
          price: priceValue,
          description: product.description || '',
        }
        
        console.log('[fetchProduct] 설정할 formData:', formDataToSet)
        
        setFormData(formDataToSet)
      }
    } catch (error) {
      console.error('상품 조회 오류:', error)
      alert('상품 정보를 불러올 수 없습니다.')
      navigate('/admin')
    } finally {
      setIsLoadingProduct(false)
    }
  }

  // 이미지 URL이 변경될 때 미리보기 업데이트
  useEffect(() => {
    if (formData.image) {
      setImagePreview(formData.image)
    } else {
      setImagePreview('')
    }
  }, [formData.image])

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value
    
    // 가격 필드의 경우 숫자만 추출하고 콤마 포맷팅
    if (name === 'price') {
      // 숫자가 아닌 문자 제거 (콤마 포함)
      const numericValue = value.replace(/[^\d]/g, '')
      processedValue = numericValue
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // 가격 값을 한국 원화 형식으로 포맷팅 (콤마 추가)
  const formatPrice = (price) => {
    // 디버깅
    console.log('[formatPrice] 입력값:', price, '타입:', typeof price)
    
    // 빈 값 체크 (null, undefined, 빈 문자열)
    if (price === null || price === undefined || price === '') {
      console.log('[formatPrice] 빈 값 반환')
      return ''
    }
    
    // 문자열로 변환
    const priceStr = String(price)
    console.log('[formatPrice] priceStr:', priceStr)
    
    // 숫자가 아닌 문자 제거 (콤마, 공백 등)
    const numericValue = priceStr.replace(/[^\d]/g, '')
    console.log('[formatPrice] numericValue:', numericValue)
    
    // 숫자가 없으면 빈 문자열 반환
    if (numericValue === '' || numericValue === '0') {
      console.log('[formatPrice] 숫자 없음 또는 0 반환')
      return ''
    }
    
    // 숫자로 변환 후 검증
    const num = Number(numericValue)
    console.log('[formatPrice] num:', num, 'isNaN:', isNaN(num), '<= 0:', num <= 0)
    
    if (isNaN(num) || num <= 0) {
      console.log('[formatPrice] 검증 실패 - 빈 문자열 반환')
      return ''
    }
    
    // 한국 원화 형식으로 포맷팅 (콤마 추가)
    const result = num.toLocaleString('ko-KR')
    console.log('[formatPrice] 최종 결과:', result)
    return result
  }

  // Cloudinary 위젯 열기
  const openCloudinaryWidget = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName) {
      alert('Cloudinary 클라우드 이름이 설정되지 않았습니다. .env 파일에 VITE_CLOUDINARY_CLOUD_NAME을 설정해주세요.')
      return
    }

    if (!uploadPreset) {
      alert('Cloudinary 업로드 프리셋이 설정되지 않았습니다. .env 파일에 VITE_CLOUDINARY_UPLOAD_PRESET을 설정해주세요.')
      return
    }

    if (window.cloudinary) {
      window.cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          multiple: false,
          maxFileSize: 5000000, // 5MB
          resourceType: 'image',
          clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
        },
        (error, result) => {
          if (!error && result && result.event === 'success') {
            const imageUrl = result.info.secure_url
            setFormData(prev => ({
              ...prev,
              image: imageUrl
            }))
            if (errors.image) {
              setErrors(prev => ({
                ...prev,
                image: ''
              }))
            }
          }
        }
      ).open()
    } else {
      alert('Cloudinary 위젯을 로드할 수 없습니다. 페이지를 새로고침해주세요.')
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.productNumber.trim()) {
      newErrors.productNumber = '상품번호를 입력해주세요.'
    }
    if (!formData.name.trim()) {
      newErrors.name = '상품명을 입력해주세요.'
    }
    if (!formData.image.trim()) {
      newErrors.image = '상품 이미지 URL을 입력해주세요.'
    } else if (!/^https?:\/\/.+/.test(formData.image.trim())) {
      newErrors.image = '유효한 이미지 URL을 입력해주세요.'
    }
    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요.'
    } else if (!['카메라', '렌즈'].includes(formData.category)) {
      newErrors.category = '카테고리는 카메라 또는 렌즈여야 합니다.'
    }
    if (!formData.price || formData.price === '') {
      newErrors.price = '가격을 입력해주세요.'
    } else {
      const priceNum = Number(formData.price)
      if (isNaN(priceNum) || priceNum < 0) {
        newErrors.price = '가격은 0 이상의 숫자여야 합니다.'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccessMessage('')
    setErrors({})
    if (!validate()) return
    setIsSubmitting(true)

    try {
      const productData = {
        productNumber: formData.productNumber.trim(),
        name: formData.name.trim(),
        image: formData.image.trim(),
        category: formData.category,
        price: Number(formData.price),
        description: formData.description.trim() || undefined,
      }

      let response
      if (isEditMode) {
        // 수정 모드: PUT 요청
        response = await axios.put(`${API_BASE_URL}/api/products/${id}`, productData, {
          headers: { 'Content-Type': 'application/json' },
        })
      } else {
        // 등록 모드: POST 요청
        response = await axios.post(`${API_BASE_URL}/api/products`, productData, {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (response.data.success) {
        setSuccessMessage(isEditMode ? '상품이 성공적으로 수정되었습니다!' : '상품이 성공적으로 등록되었습니다!')
        if (!isEditMode) {
          setFormData({
            productNumber: '',
            name: '',
            image: '',
            category: '',
            price: '',
            description: '',
          })
          setErrors({})
        }
        setTimeout(() => {
          navigate('/admin')
        }, 1500)
      }
    } catch (error) {
      console.error('상품 등록 오류:', error)
      if (error.response) {
        const errorData = error.response.data
        if (errorData.message) {
          setServerError(errorData.message)
        }
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {}
          errorData.errors.forEach((errMsg) => {
            if (errMsg.includes('상품번호')) fieldErrors.productNumber = errMsg
            else if (errMsg.includes('상품명')) fieldErrors.name = errMsg
            else if (errMsg.includes('이미지')) fieldErrors.image = errMsg
            else if (errMsg.includes('카테고리')) fieldErrors.category = errMsg
            else if (errMsg.includes('가격')) fieldErrors.price = errMsg
          })
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...fieldErrors }))
          }
        }
      } else if (error.request) {
        setServerError('서버에 연결할 수 없습니다.')
      } else {
        setServerError('요청 중 오류가 발생했습니다: ' + error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !user || user.userType !== 'ADMIN') {
    return null
  }

  if (isLoadingProduct) {
    return (
      <div className="admin-product-new">
        <Navbar />
        <div className="admin-product-new-container">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>상품 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-product-new">
      <Navbar />
      <div className="admin-product-new-container">
        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          ← 상품 관리로 돌아가기
        </button>

        <div className="admin-form-wrapper">
          <div className="admin-header">
            <h1 className="admin-title">{isEditMode ? '상품 수정' : '상품 등록'}</h1>
            <p className="admin-subtitle">
              {isEditMode ? '상품 정보를 수정해주세요.' : '새로운 상품 정보를 입력해주세요.'}
            </p>
          </div>
          
          <form className="admin-form" onSubmit={handleSubmit}>
            {successMessage && (
              <div className="success-message">✅ {successMessage}</div>
            )}
            {serverError && (
              <div className="server-error-message">⚠️ {serverError}</div>
            )}

            <div className="form-group">
              <label htmlFor="productNumber">
                상품번호 <span className="required">*</span>
              </label>
              <input
                type="text"
                id="productNumber"
                name="productNumber"
                value={formData.productNumber}
                onChange={handleChange}
                className={errors.productNumber ? 'error' : ''}
                placeholder="예: CAM-001"
              />
              {errors.productNumber && (
                <span className="error-message">{errors.productNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="name">
                상품명 <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="예: EOS R6 Mark III"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="image">
                상품 이미지 <span className="required">*</span>
              </label>
              
              {/* 이미지 업로드 버튼 */}
              <div className="image-upload-section">
                <button
                  type="button"
                  className="upload-button"
                  onClick={openCloudinaryWidget}
                >
                  <span className="upload-icon">⬆️</span>
                  이미지를 업로드하세요
                </button>
                <p className="upload-hint">PNG, JPG, WEBP (최대 5MB)</p>
              </div>

              {/* 이미지 URL 입력 (선택사항) */}
              <input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className={errors.image ? 'error' : ''}
                placeholder="또는 이미지 URL을 직접 입력하세요"
                style={{ marginTop: '0.5rem' }}
              />
              
              {/* 이미지 미리보기 */}
              {imagePreview && (
                <div className="image-preview">
                  <img 
                    src={imagePreview} 
                    alt="상품 미리보기"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                  <button
                    type="button"
                    className="remove-image-button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, image: '' }))
                      setImagePreview('')
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              
              {errors.image && <span className="error-message">{errors.image}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category">
                카테고리 <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={errors.category ? 'error' : ''}
              >
                <option value="">카테고리 선택</option>
                <option value="카메라">카메라</option>
                <option value="렌즈">렌즈</option>
              </select>
              {errors.category && (
                <span className="error-message">{errors.category}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="price">
                가격 <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formatPrice(formData.price)}
                  onChange={handleChange}
                  className={errors.price ? 'error' : ''}
                  placeholder="예: 1,500,000"
                  inputMode="numeric"
                />
                <span style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#666',
                  pointerEvents: 'none'
                }}>
                  원
                </span>
              </div>
              {errors.price && (
                <span className="error-message">{errors.price}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">상품 설명</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="6"
                placeholder="상품에 대한 상세 설명을 입력해주세요."
              />
            </div>

            <div className="form-actions">
              <button 
                type="button"
                className="cancel-button"
                onClick={() => navigate('/admin')}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? '처리 중...' : (isEditMode ? '상품 수정' : '상품 등록')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminProductNew
