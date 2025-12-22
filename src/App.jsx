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
      
      try {
        setError(null)
        
        // 首先从本地存储获取用户信息，确保应用能快速加载
        console.log('检查本地存储中的用户信息...');
        const storedUser = localStorage.getItem('supabase.auth.user');
        const storedProfile = localStorage.getItem('supabase.auth.profile');
        let currentUser = null;
        
        // 使用本地存储初始化状态
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          currentUser = parsedUser;
          console.log('✓ 从本地存储恢复用户信息:', parsedUser);
        } else {
          console.log('本地存储中没有用户信息');
        }
        
        if (storedProfile && currentUser) {
          const parsedProfile = JSON.parse(storedProfile);
          setUserProfile(parsedProfile);
          console.log('✓ 从本地存储恢复用户资料:', parsedProfile);
        } else {
          console.log('本地存储中没有用户资料或用户未登录');
        }
        
        // 然后异步尝试从Supabase更新用户信息，不影响应用初始加载
        console.log('异步向Supabase请求更新用户信息...');
        try {
          // 设置超时Promise，增加超时时间到30秒
          const getUserTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('获取用户信息超时')), 30000)
          });
          
          const result = await Promise.race([
            supabase.auth.getUser(),
            getUserTimeout
          ]);
          
          const supabaseUser = result.data?.user;
          console.log('Supabase用户信息获取结果:', supabaseUser ? '已登录' : '未登录');
          
          if (supabaseUser) {
            // 如果Supabase返回了用户信息，更新状态和本地存储
            setUser(supabaseUser);
            localStorage.setItem('supabase.auth.user', JSON.stringify(supabaseUser));
            console.log('✓ 已更新用户信息');
            
            // 异步获取用户资料
            try {
              // 统一超时时间到30秒
              const profileTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('获取用户资料超时')), 30000)
              });
              
              const profileResult = await Promise.race([
                supabase.from('profiles').select('*').eq('id', supabaseUser.id).single(),
                profileTimeout
              ]);
              
              if (profileResult.data) {
                // 确保用户资料中有user_type字段
                const profileData = {
                  ...profileResult.data,
                  user_type: profileResult.data.user_type || 'user' // 如果没有user_type字段，默认设为普通用户
                };
                setUserProfile(profileData);
                localStorage.setItem('supabase.auth.profile', JSON.stringify(profileData));
                console.log('✓ 已更新用户资料:', profileData);
              }
            } catch (profileError) {
              console.warn('⚠ 异步获取用户资料超时:', profileError);
              // 超时不影响应用，继续使用本地存储的资料
            }
          } else {
            // 如果Supabase返回未登录，但本地有登录信息，清除本地信息
            if (currentUser) {
              console.warn('⚠ Supabase显示未登录，清除本地存储');
              setUser(null);
              setUserProfile(null);
              localStorage.removeItem('supabase.auth.user');
              localStorage.removeItem('supabase.auth.profile');
            }
          }
        } catch (getUserError) {
          console.warn('⚠ 异步获取Supabase用户信息失败:', getUserError);
          // 这里不抛出错误，因为我们已经有本地存储的数据可用
          // 记录错误但不影响用户体验
        }
        
      } catch (error) {
        console.error('✗ 与Supabase服务器通信发生严重错误:', error);
        // 只记录错误，不设置error状态，让应用继续运行
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
            // 为用户资料获取添加超时处理
            const profileTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('获取用户资料超时')), 30000)
            });
            
            const profileResult = await Promise.race([
              supabase.from('profiles').select('*').eq('id', loggedInUser.id).single(),
              profileTimeout
            ]);
            
            const profileData = profileResult.data;
            // 确保用户资料中有user_type字段
            const profileWithType = {
              ...profileData,
              user_type: profileData.user_type || 'user' // 如果没有user_type字段，默认设为普通用户
            };
            console.log('✓ 用户资料获取成功:', profileWithType);
            setUserProfile(profileWithType)
            // 存储用户资料到本地存储
            localStorage.setItem('supabase.auth.profile', JSON.stringify(profileWithType))
            console.log('✓ 用户资料已保存到本地存储');
          } catch (profileError) {
            console.warn('⚠ 获取用户资料超时，继续使用本地存储的数据:', profileError);
            // 不设置UserProfile为null，继续使用现有的数据
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