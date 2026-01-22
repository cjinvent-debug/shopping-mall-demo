import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 페이지 전환 시 스크롤을 맨 위로 이동하는 컴포넌트
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // 페이지 전환 시 스크롤을 즉시 맨 위로 이동 (애니메이션 없이)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

export default ScrollToTop
