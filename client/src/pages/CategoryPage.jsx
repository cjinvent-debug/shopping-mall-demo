import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './CategoryPage.css'

function CategoryPage() {
  const { categoryName } = useParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // 페이지 마운트 및 카테고리 변경 시 스크롤을 맨 위로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    fetchProducts()
  }, [categoryName])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      // 카테고리별 상품 조회 (limit을 크게 설정하여 모든 상품 가져오기)
      const response = await axios.get(
        `${API_BASE_URL}/api/products?category=${categoryName}&limit=1000`
      )
      if (response.data.success) {
        const productList = response.data.data || []
        setProducts(productList)
      }
    } catch (error) {
      console.error('상품 목록 조회 오류:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const getCategoryTitle = () => {
    const titles = {
      '카메라': '카메라',
      '렌즈': '렌즈',
    }
    return titles[categoryName] || categoryName
  }

  const getCategoryIcon = () => {
    const icons = {
      '카메라': '📷',
      '렌즈': '🔍',
    }
    return icons[categoryName] || '📦'
  }

  return (
    <div className="category-page">
      <Navbar />

      <div className="category-container">
        <div className="category-header">
          <div className="category-icon">{getCategoryIcon()}</div>
          <h1 className="category-title">{getCategoryTitle()}</h1>
          <p className="category-subtitle">
            {getCategoryTitle()} 카테고리의 모든 상품을 확인하세요
          </p>
        </div>

        {loadingProducts ? (
          <div className="loading">로딩 중...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>등록된 {getCategoryTitle()} 상품이 없습니다.</p>
            <button 
              className="back-to-home-button"
              onClick={() => navigate('/')}
            >
              메인으로 돌아가기
            </button>
          </div>
        ) : (
          <div className="products-section">
            <div className="products-header">
              <h2 className="products-count">
                총 {products.length}개의 상품
              </h2>
            </div>
            <div className="products-grid">
              {products.map((product, index) => (
                <div 
                  key={product._id} 
                  className="product-card"
                  onClick={() => navigate(`/product/${product._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-badge">BEST {String(index + 1).padStart(2, '0')}</div>
                  <button 
                    className="product-wishlist" 
                    aria-label="찜하기"
                    onClick={(e) => {
                      e.stopPropagation()
                      // 찜하기 기능 구현 예정
                    }}
                  >
                    ♡
                  </button>
                  <div className="product-image">
                    {product.image && product.image.startsWith('http') ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <span>{product.image || '📷'}</span>
                    )}
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-price">
                    {product.price && product.price > 0
                      ? product.price.toLocaleString('ko-KR') + ' 원'
                      : '가격 문의'
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryPage
