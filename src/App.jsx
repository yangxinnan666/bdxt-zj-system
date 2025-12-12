import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Accounting from './components/Accounting'
import Order from './components/Order'
import Admin from './components/Admin'
import LogViewer from './components/LogViewer'
import { supabase } from './supabaseClient'

function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // 检查用户登录状态
    const checkUser = async () => {
      // 设置更短的超时时间，3秒后超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('与服务器通信超时')), 3000)
      })
      
      try {
        setError(null)
        
        // 尝试从本地存储先获取用户信息，提高加载速度
        const storedUser = localStorage.getItem('supabase.auth.user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
        
        // 同时执行实际请求和超时检查
        const result = await Promise.race([
          supabase.auth.getUser(),
          timeoutPromise
        ])
        
        const user = result.data?.user
        setUser(user)
        
        // 如果用户已登录，获取用户资料
        if (user) {
          try {
            const profileResult = await Promise.race([
              supabase.from('profiles').select('*').eq('id', user.id).single(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('获取用户资料超时')), 2000))
            ])
            setUserProfile(profileResult.data)
          } catch (profileError) {
            console.warn('获取用户资料超时，使用本地存储或默认值')
            // 尝试从本地存储获取用户资料
            const storedProfile = localStorage.getItem('supabase.auth.profile')
            if (storedProfile) {
              setUserProfile(JSON.parse(storedProfile))
            } else {
              console.warn('本地存储中也没有用户资料')
            }
          }
        } else {
          setUserProfile(null)
        }
      } catch (error) {
        console.error('与Supabase服务器通信失败:', error)
        setError('与服务器通信超时。请检查网络连接或稍后再试。')
        
        // 确保user和userProfile至少为null
        if (user === undefined) setUser(null)
        if (userProfile === undefined) setUserProfile(null)
      } finally {
        // 无论如何都要设置loading为false，确保页面能显示
        setLoading(false)
      }
    }

    checkUser()

    // 监听认证状态变化
    try {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const loggedInUser = session?.user || null
        setUser(loggedInUser)
        
        // 如果用户已登录，获取用户资料
        if (loggedInUser) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', loggedInUser.id)
              .single()
            setUserProfile(profile)
            // 存储用户资料到本地存储
            localStorage.setItem('supabase.auth.profile', JSON.stringify(profile))
          } catch (profileError) {
            console.error('获取用户资料失败:', profileError)
            setUserProfile(null)
          }
          localStorage.setItem('supabase.auth.user', JSON.stringify(loggedInUser))
        } else {
          setUserProfile(null)
          localStorage.removeItem('supabase.auth.user')
          localStorage.removeItem('supabase.auth.profile')
        }
      })

      return () => authListener.subscription.unsubscribe()
    } catch (listenerError) {
      console.error('设置认证状态监听器失败:', listenerError)
      // 如果监听器设置失败，仍然继续应用程序
    }
  }, [])

  if (loading) {
    return <div className="container mt-5">加载中...</div>
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">连接错误</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            <strong>建议操作：</strong>
            <ul>
              <li>检查网络连接</li>
              <li>清除浏览器缓存和Cookie</li>
              <li>禁用浏览器扩展程序</li>
              <li>尝试使用隐私模式</li>
              <li>稍后再试</li>
            </ul>
            <button 
              className="btn btn-primary mt-3" 
              onClick={() => window.location.reload()}
            >
              重试
            </button>
          </p>
        </div>
      </div>
    )
  }

  // 检查用户是否为管理员
  const isAdmin = () => {
    return user && userProfile && userProfile.user_type === 'admin'
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/accounting" element={user ? <Accounting user={user} /> : <Navigate to="/login" />} />
        <Route path="/order" element={user ? <Order user={user} /> : <Navigate to="/login" />} />
        <Route path="/admin" element={isAdmin() ? <Admin user={user} /> : <Navigate to="/dashboard" />} />
        <Route path="/logs" element={isAdmin() ? <LogViewer /> : <Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  )
}

export default App