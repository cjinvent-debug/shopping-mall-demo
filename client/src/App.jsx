import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderComplete from './pages/OrderComplete'
import OrderDetail from './pages/OrderDetail'
import OrderList from './pages/OrderList'
import MyPage from './pages/MyPage'
import CategoryPage from './pages/CategoryPage'
import Admin from './pages/Admin'
import AdminProductNew from './pages/AdminProductNew'
import AdminOrder from './pages/AdminOrder'
import ScrollToTop from './components/ScrollToTop'
import './App.css'

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/complete/:id" element={<OrderComplete />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/products/new" element={<AdminProductNew />} />
          <Route path="/admin/products/edit/:id" element={<AdminProductNew />} />
          <Route path="/admin/orders" element={<AdminOrder />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
