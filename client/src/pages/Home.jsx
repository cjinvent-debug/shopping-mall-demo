import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // 상품 데이터 가져오기
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await axios.get(`${API_BASE_URL}/api/products`)
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

  return (
    <div className="home">
      <Navbar />

      {/* 메인 배너 */}
      <section className="hero-banner">
        <div className="banner-container">
          <div className="banner-image">
            <div className="camera-display">
              <img src="/camera.jpg" alt="Camera" className="camera-image" />
            </div>
          </div>
        </div>
      </section>

      {/* 제품 그리드 */}
      <section className="products-section">
        <div className="products-container">
          {loadingProducts ? (
            <div className="loading">로딩 중...</div>
          ) : products.length === 0 ? (
            <div className="empty-state">등록된 상품이 없습니다.</div>
          ) : (
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
                  <p className="product-price">
                    {product.price && product.price > 0
                      ? product.price.toLocaleString('ko-KR') + ' 원'
                      : '가격 문의'
                    }
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-links">
            <a href="#store">매장안내</a>
            <a href="#faq">FAQ</a>
            <a href="#notice">공지사항</a>
            <a href="#company">회사소개</a>
            <a href="#magazine">매거진</a>
            <a href="#verify">임직원 인증</a>
          </div>
          
          <div className="footer-info">
            <p>카메라스토어(주) | 대표자: 홍길동 | 사업자등록번호: 123-45-67890</p>
            <p>통신판매번호: 2024-서울강남-1234 | 주소: 서울시 강남구 테헤란로 123</p>
            <p>컨택센터: 1588-1234 | Copyright © Camera Store All Rights reserved</p>
          </div>

          <div className="footer-social">
            <span>YouTube</span>
            <span>Facebook</span>
            <span>Instagram</span>
            <span>Line</span>
            <span>KakaoTalk</span>
            <span>Twitter</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
