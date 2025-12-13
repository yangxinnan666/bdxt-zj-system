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
    console.log('App组件初始化 - 开始加载用户和认证状态');
    
    // 检查用户登录状态
    const checkUser = async () => {
      console.log('开始检查用户登录状态...');
      // 设置更合理的超时时间，8秒后超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('与服务器通信超时')), 8000)
      })
      
      try {
        setError(null)
        
        // 尝试从本地存储先获取用户信息，提高加载速度
        console.log('检查本地存储中的用户信息...');
        const storedUser = localStorage.getItem('supabase.auth.user')
        let currentUser = null;
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          currentUser = parsedUser;
          console.log('✓ 从本地存储恢复用户信息:', parsedUser);
        } else {
          console.log('本地存储中没有用户信息');
        }
        
        // 同时执行实际请求和超时检查
        console.log('向Supabase请求当前用户信息...');
        let supabaseUser;
        try {
          const result = await Promise.race([
            supabase.auth.getUser(),
            timeoutPromise
          ])
          
          supabaseUser = result.data?.user
          console.log('当前用户信息获取结果:', supabaseUser ? '已登录' : '未登录');
          setUser(supabaseUser)
          currentUser = supabaseUser;
        } catch (getUserError) {
          console.error('获取用户信息失败:', getUserError);
          // 如果是无效刷新令牌错误，清除本地存储并重新加载页面
          if (getUserError.message.includes('invalid refresh token')) {
            console.warn('检测到无效刷新令牌，清除本地存储并重新加载页面...');
            localStorage.removeItem('supabase.auth.user');
            localStorage.removeItem('supabase.auth.profile');
            window.location.reload();
            return;
          }
          // 这里不再抛出错误，而是继续使用本地存储的用户信息
        }
        
        // 如果用户已登录，获取用户资料
        if (currentUser) {
          console.log('用户已登录，开始获取用户资料...');
          try {
            const profileResult = await Promise.race([
              supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('获取用户资料超时')), 5000))
            ])
            console.log('✓ 用户资料获取成功:', profileResult.data);
            setUserProfile(profileResult.data)
          } catch (profileError) {
            console.error('✗ 获取用户资料超时或失败:', profileError);
            console.warn('尝试从本地存储获取用户资料...');
            // 尝试从本地存储获取用户资料
            const storedProfile = localStorage.getItem('supabase.auth.profile')
            if (storedProfile) {
              const parsedProfile = JSON.parse(storedProfile);
              setUserProfile(parsedProfile);
              console.log('✓ 从本地存储恢复用户资料:', parsedProfile);
            } else {
              console.warn('本地存储中也没有用户资料');
            }
          }
        } else {
          setUserProfile(null)
          console.log('用户未登录，清空用户资料');
        }
      } catch (error) {
        console.error('✗ 与Supabase服务器通信失败:', error);
        setError('与服务器通信超时。请检查网络连接或稍后再试。')
        
        // 确保user和userProfile至少为null
        if (user === undefined) setUser(null)
        if (userProfile === undefined) setUserProfile(null)
      } finally {
        // 无论如何都要设置loading为false，确保页面能显示
        setLoading(false)
        console.log('用户检查流程完成，加载状态已更新');
      }
    }

    checkUser()

    // 监听认证状态变化
    try {
      console.log('设置Supabase认证状态监听...');
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 认证状态变化:', event, session);
        const loggedInUser = session?.user || null
        setUser(loggedInUser)
        
        // 如果用户已登录，获取用户资料
        if (loggedInUser) {
          console.log('用户已登录，更新用户信息并获取资料...');
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', loggedInUser.id)
              .single()
            console.log('✓ 用户资料获取成功:', profile);
            setUserProfile(profile)
            // 存储用户资料到本地存储
            localStorage.setItem('supabase.auth.profile', JSON.stringify(profile))
            console.log('✓ 用户资料已保存到本地存储');
          } catch (profileError) {
            console.error('✗ 获取用户资料失败:', profileError)
            setUserProfile(null)
          }
          localStorage.setItem('supabase.auth.user', JSON.stringify(loggedInUser))
          console.log('✓ 用户信息已保存到本地存储');
        } else {
          setUserProfile(null)
          localStorage.removeItem('supabase.auth.user')
          localStorage.removeItem('supabase.auth.profile')
          console.log('✓ 用户已登出，本地存储已清除');
        }
      })

      return () => {
        authListener.subscription.unsubscribe();
        console.log('✓ Supabase认证状态监听已清理');
      }
    } catch (listenerError) {
      console.error('✗ 设置认证状态监听器失败:', listenerError)
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