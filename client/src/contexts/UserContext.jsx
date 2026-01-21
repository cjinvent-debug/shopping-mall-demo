import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import API_BASE_URL from '../config/api'

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 토큰으로 유저 정보 가져오기
  const fetchUserInfo = async () => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success && response.data.data) {
        setUser(response.data.data)
        // localStorage에도 업데이트
        localStorage.setItem('user', JSON.stringify(response.data.data))
      } else {
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    } catch (error) {
      console.error('유저 정보 가져오기 실패:', error)
      // 토큰이 만료되었거나 유효하지 않은 경우
      setUser(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 토큰 확인 및 유저 정보 가져오기
  useEffect(() => {
    fetchUserInfo()
  }, [])

  // 로그아웃 함수
  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('tokenType')
    localStorage.removeItem('expiresIn')
  }

  // 유저 정보 업데이트 함수
  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const value = {
    user,
    loading,
    fetchUserInfo,
    logout,
    updateUser,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
