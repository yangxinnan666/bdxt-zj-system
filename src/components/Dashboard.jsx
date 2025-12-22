import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import logger from '../utils/logger'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

function Dashboard({ user }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const navigate = useNavigate()
  // 统计数据
  const [accountingStats, setAccountingStats] = useState({
    income: 0,
    expense: 0
  })
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    shipped: 0,
    delivered: 0
  })

  useEffect(() => {
    // 创建默认用户资料
    const createDefaultProfile = async () => {
      try {
        // 只插入数据库表实际需要的字段
        const defaultProfile = {
          id: user.id,
          email: user.email,
          user_type: 'user'
        };
        
        // 尝试创建用户资料
        const { data, error } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .single();
        
        if (error) {
          console.error('创建默认用户资料失败:', error);
          // 如果创建失败，直接使用默认资料
          setProfile(defaultProfile);
          // 保存到本地存储
          localStorage.setItem('bdxt.profile', JSON.stringify(defaultProfile));
          localStorage.setItem('supabase.auth.profile', JSON.stringify(defaultProfile));
        } else {
          console.log('创建默认用户资料成功:', data);
          setProfile(data);
          // 保存到本地存储
          localStorage.setItem('bdxt.profile', JSON.stringify(data));
          localStorage.setItem('supabase.auth.profile', JSON.stringify(data));
        }
      } catch (createError) {
        console.error('创建默认用户资料时出错:', createError);
        // 使用默认资料
        const defaultProfile = {
          id: user.id,
          email: user.email,
          user_type: 'user'
        };
        setProfile(defaultProfile);
        // 保存到本地存储
        localStorage.setItem('bdxt.profile', JSON.stringify(defaultProfile));
      }
    };

    const fetchProfile = async () => {
      try {
        console.log('开始获取用户资料...');
        console.log('用户ID:', user.id);
        
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .abortSignal(controller.signal);

          clearTimeout(timeoutId);
          console.log('用户资料查询结果:', { data, error });
          
          if (error) {
            console.error('查询用户资料失败:', error);
            // 如果查询出错，尝试创建默认用户资料
            await createDefaultProfile();
            return;
          }
          
          // 处理查询结果
          let profileData;
          if (Array.isArray(data)) {
            if (data.length === 0) {
              console.log('未找到用户资料，创建默认资料');
              await createDefaultProfile();
              return;
            } else {
              profileData = data[0];
            }
          } else if (data) {
            profileData = data;
          } else {
            console.log('未找到用户资料，创建默认资料');
            await createDefaultProfile();
            return;
          }
          
          // 确保用户资料中有user_type字段
          const profileWithType = {
            ...profileData,
            user_type: profileData.user_type || 'user' // 如果没有user_type字段，默认设为普通用户
          };
          
          console.log('获取用户资料成功:', profileWithType);
          setProfile(profileWithType);
          
          // 使用与App.jsx一致的本地存储键名，确保数据同步
          try {
            localStorage.setItem('supabase.auth.profile', JSON.stringify(profileWithType));
            // 同时兼容旧的存储键名
            localStorage.setItem('bdxt.profile', JSON.stringify(profileWithType));
          } catch (localError) {
            logger.error('保存用户资料到本地存储失败', localError);
          }
          
          // 不再从roles表获取角色信息，直接使用profiles表中的user_type字段
          console.log('使用profiles表中的user_type字段:', profileWithType.user_type);
          setProfile(profileWithType);
          // 更新本地存储
          localStorage.setItem('supabase.auth.profile', JSON.stringify(profileWithType));
          localStorage.setItem('bdxt.profile', JSON.stringify(profileWithType));
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error('获取用户资料超时');
          } else {
            throw fetchError;
          }
        }
      } catch (error) {
        logger.error('获取用户资料失败', {
          error: error,
          errorType: typeof error,
          details: error?.stack || error?.message || '未知错误'
        });
        
        // 当网络请求失败时，尝试从本地存储读取用户资料
        if (error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
          console.log('尝试从本地存储读取用户资料...');
          try {
            // 首先尝试从与App.jsx一致的存储键读取
            const savedProfile = localStorage.getItem('supabase.auth.profile') || localStorage.getItem('bdxt.profile');
            if (savedProfile) {
              const parsedProfile = JSON.parse(savedProfile);
              setProfile(parsedProfile);
              console.log('从本地存储恢复用户资料成功');
            } else {
              console.log('本地存储中没有用户资料');
              // 创建默认用户资料
              await createDefaultProfile();
            }
          } catch (localError) {
            console.error('从本地存储读取用户资料失败:', localError);
            // 创建默认用户资料
            await createDefaultProfile();
          }
        } else {
          // 创建默认用户资料
          await createDefaultProfile();
        }
      }
    }

    const fetchAnnouncements = async () => {
      try {
        console.log('开始获取公告...');
        
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
            .abortSignal(controller.signal);

          clearTimeout(timeoutId);
          console.log('公告查询结果:', { data, error });
          
          if (error) throw error;
          const announcementsData = data || [];
          setAnnouncements(announcementsData)
          console.log('获取公告成功');
          
          // 将公告保存到本地存储
          try {
            localStorage.setItem('bdxt.announcements', JSON.stringify(announcementsData));
          } catch (localError) {
            logger.error('保存公告到本地存储失败', localError);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            logger.error('获取公告超时', fetchError);
          } else {
            throw fetchError;
          }
        }
      } catch (error) {
        logger.error('获取公告失败', {
          error: error,
          errorType: typeof error,
          details: error?.stack || error?.message || '未知错误'
        });
        
        // 当网络请求失败时，尝试从本地存储读取公告
        if (error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
          console.log('尝试从本地存储读取公告...');
          try {
            const savedAnnouncements = localStorage.getItem('bdxt.announcements');
            if (savedAnnouncements) {
              const parsedAnnouncements = JSON.parse(savedAnnouncements);
              setAnnouncements(parsedAnnouncements);
              console.log('从本地存储恢复公告成功');
            } else {
              console.log('本地存储中没有公告');
              setAnnouncements([]);
            }
          } catch (localError) {
            console.error('从本地存储读取公告失败:', localError);
            setAnnouncements([]);
          }
        } else {
          setAnnouncements([]);
        }
      }
    }

    fetchProfile()
    fetchAnnouncements()
    setLoading(false)
  }, [user.id, user.email])

  // 获取对账统计数据
  useEffect(() => {
    const fetchAccountingStats = async () => {
      try {
        console.log('开始获取对账统计数据...');
        
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const { data } = await supabase
            .from('accounting_records')
            .select('*')
            .abortSignal(controller.signal);

          clearTimeout(timeoutId);
          
          if (data) {
            const income = data
              .filter(record => record.type === '收入')
              .reduce((sum, record) => sum + parseFloat(record.amount), 0)
            const expense = data
              .filter(record => record.type === '支出')
              .reduce((sum, record) => sum + parseFloat(record.amount), 0)

            const stats = { income, expense };
            setAccountingStats(stats)
            console.log('获取对账统计数据成功');
            
            // 将统计数据保存到本地存储
            try {
              localStorage.setItem('bdxt.accountingStats', JSON.stringify(stats));
            } catch (localError) {
              console.error('保存对账统计数据到本地存储失败:', localError);
            }
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error('获取对账统计数据超时');
          } else {
            throw fetchError;
          }
        }
      } catch (error) {
        console.error('获取对账统计失败:', error);
        
        // 当网络请求失败时，尝试从本地存储读取统计数据
        if (error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
          console.log('尝试从本地存储读取对账统计数据...');
          try {
            const savedStats = localStorage.getItem('bdxt.accountingStats');
            if (savedStats) {
              const parsedStats = JSON.parse(savedStats);
              setAccountingStats(parsedStats);
              console.log('从本地存储恢复对账统计数据成功');
            } else {
              console.log('本地存储中没有对账统计数据');
              setAccountingStats({ income: 0, expense: 0 });
            }
          } catch (localError) {
            console.error('从本地存储读取对账统计数据失败:', localError);
            setAccountingStats({ income: 0, expense: 0 });
          }
        } else {
          setAccountingStats({ income: 0, expense: 0 });
        }
      }
    }
    fetchAccountingStats()
  }, [])

  // 获取订单统计数据
  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        console.log('开始获取订单统计数据...');
        
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .abortSignal(controller.signal);

          clearTimeout(timeoutId);
          
          if (data) {
            const pending = data.filter(order => order.status === '待发货').length
            const shipped = data.filter(order => order.status === '已发货').length
            const delivered = data.filter(order => order.status === '已签收').length

            const stats = { pending, shipped, delivered };
            setOrderStats(stats)
            console.log('获取订单统计数据成功');
            
            // 将订单统计数据保存到本地存储
            try {
              localStorage.setItem(`bdxt.orderStats_${user.id}`, JSON.stringify(stats));
            } catch (localError) {
              console.error('保存订单统计数据到本地存储失败:', localError);
            }
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error('获取订单统计数据超时');
          } else {
            throw fetchError;
          }
        }
      } catch (error) {
        console.error('获取订单统计失败:', error);
        
        // 当网络请求失败时，尝试从本地存储读取订单统计数据
        if (error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
          console.log('尝试从本地存储读取订单统计数据...');
          try {
            const savedStats = localStorage.getItem(`bdxt.orderStats_${user.id}`);
            if (savedStats) {
              const parsedStats = JSON.parse(savedStats);
              setOrderStats(parsedStats);
              console.log('从本地存储恢复订单统计数据成功');
            } else {
              console.log('本地存储中没有订单统计数据');
              setOrderStats({ pending: 0, shipped: 0, delivered: 0 });
            }
          } catch (localError) {
            console.error('从本地存储读取订单统计数据失败:', localError);
            setOrderStats({ pending: 0, shipped: 0, delivered: 0 });
          }
        } else {
          setOrderStats({ pending: 0, shipped: 0, delivered: 0 });
        }
      }
    }
    fetchOrderStats()
  }, [user.id])

  const handleLogout = async () => {
    try {
      // 不使用AbortController，直接调用signOut
      try {
        // 使用默认选项调用signOut
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.error('与Supabase服务器通信失败:', error)
          console.warn('由于网络问题，将执行本地登出逻辑')
        }
      } catch (fetchError) {
        console.error('登出请求发生错误:', fetchError)
        console.warn('将执行本地登出逻辑')
      }
      
      // 无论如何都执行本地登出逻辑
      // 清除所有与应用相关的本地存储数据
      try {
        // 清除Supabase认证相关数据
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('supabase.auth.refreshToken')
        localStorage.removeItem('supabase.auth.session')
        
        // 清除我们自己保存的数据
        localStorage.removeItem('bdxt.profile')
        localStorage.removeItem('bdxt.announcements')
        localStorage.removeItem('bdxt.accountingStats')
        localStorage.removeItem('bdxt.orderStats')
        localStorage.removeItem('bdxt.accountingRecords')
        localStorage.removeItem('bdxt.orders')
        
        // 清除会话存储（如果有）
        sessionStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.refreshToken')
        sessionStorage.removeItem('supabase.auth.session')
      } catch (e) {
        console.error('清除本地存储失败:', e)
      }
      
      // 导航到登录页
      navigate('/login')
    } catch (error) {
      console.error('登出过程发生错误:', error)
      // 即使发生异常，也要尝试导航到登录页
      try {
        navigate('/login')
      } catch (navError) {
        console.error('导航失败:', navError)
        alert('登出失败，请手动刷新页面')
      }
    }
  }

  if (loading) {
    return <div className="container mt-5">加载中...</div>
  }

  return (
    <div className="dashboard-container">
      {/* 侧边导航 */}
      <nav className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <i className="bi bi-clipboard-data fs-2"></i>
            <span className="logo-text">对账系统</span>
          </div>
        </div>
        
        <div className="sidebar-profile">
          <div className="profile-icon">
            <i className="bi bi-person-circle fs-1"></i>
          </div>
          <div className="profile-info">
            <h5 className="profile-name">欢迎回来</h5>
            <p className="profile-email">{profile?.email}</p>
            <span className={`profile-role ${profile?.user_type === 'admin' ? 'role-admin' : 'role-user'}`}>
              {profile?.user_type === 'admin' ? '管理员' : '普通用户'}
            </span>
          </div>
        </div>
        
        <div className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <i className="bi bi-house-door nav-icon"></i>
            <span className="nav-text">首页</span>
          </Link>
          <Link to="/accounting" className="nav-item">
            <i className="bi bi-calculator nav-icon"></i>
            <span className="nav-text">对账系统</span>
          </Link>
          <Link to="/order" className="nav-item">
            <i className="bi bi-file-earmark-text nav-icon"></i>
            <span className="nav-text">报单系统</span>
          </Link>
          {profile?.user_type === 'admin' && (
            <Link to="/admin" className="nav-item">
              <i className="bi bi-gear nav-icon"></i>
              <span className="nav-text">管理中心</span>
            </Link>
          )}
          <button onClick={handleLogout} className="nav-item logout">
            <i className="bi bi-box-arrow-right nav-icon"></i>
            <span className="nav-text">退出登录</span>
          </button>
        </div>
      </nav>
      
      {/* 主内容 */}
      <main className="dashboard-main">
        {/* 顶部导航栏 */}
        <header className="main-header">
          <div className="header-left">
            <h1 className="page-title">系统概览</h1>
            <p className="page-subtitle">欢迎使用对账与报单系统</p>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button className="action-btn">
                <i className="bi bi-bell"></i>
              </button>
              <button className="action-btn">
                <i className="bi bi-question-circle"></i>
              </button>
            </div>
          </div>
        </header>
        
        {/* 统计卡片 */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">总收入</h3>
                <i className="bi bi-arrow-up-circle stat-icon"></i>
              </div>
              <div className="stat-value">¥{accountingStats.income.toFixed(2)}</div>
              <div className="stat-info">
                <span className="stat-change positive">+12.5%</span>
                <span className="stat-period">相比上月</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">总支出</h3>
                <i className="bi bi-arrow-down-circle stat-icon"></i>
              </div>
              <div className="stat-value">¥{accountingStats.expense.toFixed(2)}</div>
              <div className="stat-info">
                <span className="stat-change negative">-8.3%</span>
                <span className="stat-period">相比上月</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">结余</h3>
                <i className="bi bi-cash-coin stat-icon"></i>
              </div>
              <div className="stat-value">¥{(accountingStats.income - accountingStats.expense).toFixed(2)}</div>
              <div className="stat-info">
                <span className="stat-change positive">+15.2%</span>
                <span className="stat-period">相比上月</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* 图表区域 */}
        <section className="charts-section">
          <div className="charts-grid">
            {/* 对账统计图表 */}
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title">
                  <i className="bi bi-calculator chart-icon"></i>
                  <h3>对账统计</h3>
                </div>
                <div className="chart-actions">
                  <button className="chart-action-btn">本月</button>
                  <button className="chart-action-btn active">本季</button>
                  <button className="chart-action-btn">本年</button>
                </div>
              </div>
              <div className="chart-container">
                <Doughnut 
                  data={{
                    labels: ['收入', '支出'],
                    datasets: [{
                      data: [accountingStats.income, accountingStats.expense],
                      backgroundColor: ['#333333', '#999999'],
                      borderColor: ['#333333', '#999999'],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0)
                            const percentage = Math.round((context.parsed / total) * 100)
                            return `${context.label}: ¥${context.parsed.toFixed(2)} (${percentage}%)`
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            {/* 订单统计图表 */}
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title">
                  <i className="bi bi-box chart-icon"></i>
                  <h3>订单状态统计</h3>
                </div>
                <div className="chart-actions">
                  <button className="chart-action-btn">今日</button>
                  <button className="chart-action-btn active">本周</button>
                  <button className="chart-action-btn">本月</button>
                </div>
              </div>
              <div className="chart-container">
                <Doughnut 
                  data={{
                    labels: ['待发货', '已发货', '已签收'],
                    datasets: [{
                      data: [orderStats.pending, orderStats.shipped, orderStats.delivered],
                      backgroundColor: ['#333333', '#666666', '#999999'],
                      borderColor: ['#333333', '#666666', '#999999'],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0)
                            const percentage = Math.round((context.parsed / total) * 100)
                            return `${context.label}: ${context.parsed} 个 (${percentage}%)`
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* 公告区域 */}
        <section className="announcements-section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="bi bi-bullhorn"></i>
              最新公告
            </h2>
            <button className="section-action">查看全部</button>
          </div>
          
          <div className="announcements-list">
            {announcements.length > 0 ? (
              announcements.map((announcement) => (
                <div key={announcement.id} className="announcement-card">
                  <div className="announcement-header">
                    <h3 className="announcement-title">{announcement.title}</h3>
                    <span className="announcement-date">
                      {new Date(announcement.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="announcement-content">{announcement.content}</p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <i className="bi bi-info-circle fs-3"></i>
                <p>暂无公告</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard