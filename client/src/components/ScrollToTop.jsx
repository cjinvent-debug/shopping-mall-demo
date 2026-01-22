import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 페이지 전환 시 스크롤을 맨 위로 이동하는 컴포넌트
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // requestAnimationFrame을 사용하여 레이아웃 리플로우 후 스크롤 처리
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
      // 추가로 document.documentElement도 설정하여 확실하게 처리
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }, [pathname])

  return null
}

export default ScrollToTop
