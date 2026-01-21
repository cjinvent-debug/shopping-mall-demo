import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './ProductDetail.css'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: userLoading } = useUser()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/products/${id}`)
      if (response.data.success) {
        setProduct(response.data.data)
      } else {
        alert('상품을 찾을 수 없습니다.')
        navigate('/')
      }
    } catch (error) {
      console.error('상품 조회 오류:', error)
      alert('상품 정보를 불러올 수 없습니다.')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    // 로그인 확인
    if (!user) {
      if (window.confirm('장바구니에 추가하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login')
      }
      return
    }

    // 상품 ID 확인
    if (!id) {
      alert('상품 정보를 찾을 수 없습니다.')
      console.error('상품 ID가 없습니다:', id)
      return
    }

    try {
      setAddingToCart(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        alert('로그인 토큰이 없습니다. 다시 로그인해주세요.')
        navigate('/login')
        return
      }

      console.log('[장바구니 추가] 요청 데이터:', { productId: id, quantity: 1 })

      const response = await axios.post(
        `${API_BASE_URL}/api/cart`,
        {
          productId: id,
          quantity: 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('[장바구니 추가] 응답:', response.data)

      if (response.data.success) {
        alert('장바구니에 상품이 추가되었습니다.')
        // Navbar의 장바구니 수 업데이트를 위해 이벤트 발생
        window.dispatchEvent(new CustomEvent('cartUpdated'))
        
        // 장바구니 페이지로 이동할지 물어보기
        if (window.confirm('장바구니로 이동하시겠습니까?')) {
          navigate('/cart')
        }
      } else {
        // success가 false인 경우
        const errorMessage = response.data.message || '장바구니 추가에 실패했습니다.'
        alert(errorMessage)
        console.error('[장바구니 추가] 서버 응답 오류:', response.data)
      }
    } catch (error) {
      console.error('[장바구니 추가] 전체 오류:', error)
      console.error('[장바구니 추가] 오류 응답:', error.response?.data)
      console.error('[장바구니 추가] 오류 상태:', error.response?.status)
      console.error('[장바구니 추가] 요청 URL:', error.config?.url)
      
      if (!error.response) {
        // 네트워크 오류
        alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.\n\n오류: ' + (error.message || '알 수 없는 오류'))
      } else {
        const status = error.response.status
        const errorData = error.response.data || {}
        let errorMessage = errorData.message || '알 수 없는 오류가 발생했습니다.'
        
        if (status === 401) {
          errorMessage = '로그인이 필요하거나 토큰이 만료되었습니다. 다시 로그인해주세요.'
          alert(errorMessage)
          navigate('/login')
        } else if (status === 404) {
          // 404 에러일 때 더 명확한 메시지
          if (errorMessage.includes('Route not found')) {
            errorMessage = '장바구니 API를 찾을 수 없습니다. 서버를 재시작해주세요.\n\n(서버 라우트가 등록되지 않았을 수 있습니다)'
          }
          alert(errorMessage)
        } else if (status === 400) {
          alert(errorMessage)
        } else if (status === 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          alert(errorMessage)
        } else {
          alert(`오류가 발생했습니다. (상태 코드: ${status})\n\n${errorMessage}`)
        }
      }
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    // 로그인 확인
    if (!user) {
      if (window.confirm('바로 구매하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login')
      }
      return
    }

    // 상품 ID 확인
    if (!id) {
      alert('상품 정보를 찾을 수 없습니다.')
      return
    }

    try {
      setBuyingNow(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        alert('로그인 토큰이 없습니다. 다시 로그인해주세요.')
        navigate('/login')
        return
      }

      // 장바구니에 상품 추가
      const response = await axios.post(
        `${API_BASE_URL}/api/cart`,
        {
          productId: id,
          quantity: 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.success) {
        // Navbar의 장바구니 수 업데이트를 위해 이벤트 발생
        window.dispatchEvent(new CustomEvent('cartUpdated'))
        
        // 바로 결제 페이지로 이동
        navigate('/checkout')
      } else {
        const errorMessage = response.data.message || '장바구니 추가에 실패했습니다.'
        alert(errorMessage)
      }
    } catch (error) {
      console.error('[바로 구매하기] 오류:', error)
      
      if (!error.response) {
        alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.')
      } else {
        const status = error.response.status
        const errorData = error.response.data || {}
        let errorMessage = errorData.message || '알 수 없는 오류가 발생했습니다.'
        
        if (status === 401) {
          errorMessage = '로그인이 필요하거나 토큰이 만료되었습니다. 다시 로그인해주세요.'
          alert(errorMessage)
          navigate('/login')
        } else if (status === 400) {
          alert(errorMessage)
        } else {
          alert(`오류가 발생했습니다. (상태 코드: ${status})\n\n${errorMessage}`)
        }
      }
    } finally {
      setBuyingNow(false)
    }
  }

  if (loading) {
    return (
      <div className="product-detail">
        <Navbar />
        <div className="product-detail-container">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail">
        <Navbar />
        <div className="product-detail-container">
          <div className="empty-state">상품을 찾을 수 없습니다.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-detail">
      <Navbar />
      <div className="product-detail-container">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← 목록으로
        </button>

        <div className="product-detail-content">
          <div className="product-image-section">
            {product.image && product.image.startsWith('http') ? (
              <img src={product.image} alt={product.name} className="product-main-image" />
            ) : (
              <div className="product-image-placeholder">📷</div>
            )}
          </div>

          <div className="product-info-section">
            <div className="product-category">{product.category}</div>
            <h1 className="product-title">{product.name}</h1>
            {product.productNumber && (
              <div className="product-number">상품번호: {product.productNumber}</div>
            )}
            <div className="product-price-section">
              <span className="price-label">가격</span>
              <span className="product-price">
                {product.price && product.price > 0
                  ? product.price.toLocaleString('ko-KR') + ' 원'
                  : '가격 문의'
                }
              </span>
            </div>

            {product.description && (
              <div className="product-description">
                <h3>상품 설명</h3>
                <p>{product.description}</p>
              </div>
            )}

            <div className="product-actions">
              <button 
                className="cart-button" 
                onClick={handleAddToCart}
                disabled={addingToCart || buyingNow}
              >
                {addingToCart ? '추가 중...' : '장바구니 담기'}
              </button>
              <button 
                className="buy-button"
                onClick={handleBuyNow}
                disabled={addingToCart || buyingNow}
              >
                {buyingNow ? '처리 중...' : '바로구매하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
