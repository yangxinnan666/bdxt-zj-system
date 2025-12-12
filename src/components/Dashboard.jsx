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
        } else {
          console.log('创建默认用户资料成功:', data);
          setProfile(data);
          // 保存到本地存储
          localStorage.setItem('bdxt.profile', JSON.stringify(data));
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
          if (Array.isArray(data)) {
            if (data.length === 0) {
              console.log('未找到用户资料，创建默认资料');
              await createDefaultProfile();
              return;
            } else if (data.length === 1) {
              console.log('获取用户资料成功');
              setProfile(data[0]);
            } else {
              console.warn('找到多条用户资料记录，使用第一条');
              setProfile(data[0]);
            }
          } else if (data) {
            // 结果已经是单个对象
            console.log('获取用户资料成功');
            setProfile(data);
          } else {
            console.log('未找到用户资料，创建默认资料');
            await createDefaultProfile();
            return;
          }
          
          // 获取用户角色
          try {
            const { data: roleData, error: roleError } = await supabase
              .from('roles')
              .select('role')
              .eq('user_id', user.id)
              .single();
            
            if (roleError) {
              console.error('获取用户角色失败:', roleError);
            } else if (roleData) {
              console.log('获取用户角色成功:', roleData.role);
              // 更新profile添加角色信息
              const profileWithRole = { ...data, user_type: roleData.role };
              setProfile(profileWithRole);
              // 更新本地存储
              localStorage.setItem('bdxt.profile', JSON.stringify(profileWithRole));
            }
          } catch (roleFetchError) {
            logger.error('获取用户角色出错', roleFetchError);
          }
          
          // 将用户资料保存到本地存储
          try {
            localStorage.setItem('bdxt.profile', JSON.stringify(data));
          } catch (localError) {
            logger.error('保存用户资料到本地存储失败', localError);
          }
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
            const savedProfile = localStorage.getItem('bdxt.profile');
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
    <div className="container mt-5 dashboard-container">
      <div className="row">
        {/* 侧边导航 */}
        <div className="col-md-3 mb-4">
          <div className="card dashboard-card shadow-sm">
            <div className="card-body dashboard-profile">
              <div className="text-center mb-4">
                <div className="profile-icon mb-3">
                  <i className="bi bi-person-circle fs-1"></i>
                </div>
                <h5 className="card-title mb-1">欢迎回来</h5>
                <p className="card-text text-muted mb-0">{profile?.email}</p>
                <div className="mt-2">
                  <span className={`badge ${profile?.user_type === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                    {profile?.user_type === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </div>
              </div>
              <hr />
              <nav className="nav flex-column dashboard-nav">
                <Link to="/dashboard" className="nav-link active dashboard-nav-link">
                  <i className="bi bi-house-door me-2"></i>首页
                </Link>
                <Link to="/accounting" className="nav-link dashboard-nav-link">
                  <i className="bi bi-calculator me-2"></i>对账系统
                </Link>
                <Link to="/order" className="nav-link dashboard-nav-link">
                  <i className="bi bi-file-earmark-text me-2"></i>报单系统
                </Link>
                {profile?.user_type === 'admin' && (
                  <Link to="/admin" className="nav-link dashboard-nav-link">
                    <i className="bi bi-gear me-2"></i>管理中心
                  </Link>
                )}
                <button onClick={handleLogout} className="nav-link btn btn-link text-danger dashboard-nav-link">
                  <i className="bi bi-box-arrow-right me-2"></i>退出登录
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* 主内容 */}
        <div className="col-md-9">
          <div className="card mb-4 dashboard-card shadow-sm">
            <div className="card-body">
              <h3 className="card-title dashboard-header">系统概览</h3>
              <p className="card-text text-muted">欢迎使用对账与报单系统</p>
              
              {/* 统计卡片 */}
              <div className="row mt-4">
                <div className="col-md-4 mb-4">
                  <div className="card bg-primary text-white shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 className="card-subtitle mb-1 text-light">总收入</h6>
                          <p className="card-text display-4">¥{accountingStats.income.toFixed(2)}</p>
                        </div>
                        <i className="bi bi-arrow-up-circle fs-1 opacity-75"></i>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-4">
                  <div className="card bg-danger text-white shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 className="card-subtitle mb-1 text-light">总支出</h6>
                          <p className="card-text display-4">¥{accountingStats.expense.toFixed(2)}</p>
                        </div>
                        <i className="bi bi-arrow-down-circle fs-1 opacity-75"></i>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-4">
                  <div className="card bg-success text-white shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 className="card-subtitle mb-1 text-light">结余</h6>
                          <p className="card-text display-4">¥{(accountingStats.income - accountingStats.expense).toFixed(2)}</p>
                        </div>
                        <i className="bi bi-cash-coin fs-1 opacity-75"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 统计图表 */}
              <div className="row mt-4">
                {/* 对账统计图表 */}
                <div className="col-md-6 mb-4">
                  <div className="card dashboard-card shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-calculator me-2 text-primary"></i>
                        <h5 className="card-title mb-0">对账统计</h5>
                      </div>
                      <div className="chart-container" style={{ height: '300px' }}>
                        <Doughnut 
                          data={{
                            labels: ['收入', '支出'],
                            datasets: [{
                              data: [accountingStats.income, accountingStats.expense],
                              backgroundColor: ['#0d6efd', '#dc3545'],
                              borderColor: ['#0d6efd', '#dc3545'],
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
                  </div>
                </div>

                {/* 订单统计图表 */}
                <div className="col-md-6 mb-4">
                  <div className="card dashboard-card shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-box me-2 text-primary"></i>
                        <h5 className="card-title mb-0">订单状态统计</h5>
                      </div>
                      <div className="chart-container" style={{ height: '300px' }}>
                        <Doughnut 
                          data={{
                            labels: ['待发货', '已发货', '已签收'],
                            datasets: [{
                              data: [orderStats.pending, orderStats.shipped, orderStats.delivered],
                              backgroundColor: ['#ffc107', '#198754', '#0d6efd'],
                              borderColor: ['#ffc107', '#198754', '#0d6efd'],
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
                </div>
              </div>
            </div>
          </div>

          {/* 公告 */}
          <div className="card mb-4 dashboard-card shadow-sm">
            <div className="card-body">
              <h5 className="card-title dashboard-section-title">
                <i className="bi bi-bullhorn me-2"></i>最新公告
              </h5>
              {announcements.length > 0 ? (
                <div className="announcement-list">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="announcement-item p-3 mb-3 rounded border border-light">
                      <h6 className="announcement-title">{announcement.title}</h6>
                      <p className="announcement-content mt-1 mb-2">{announcement.content}</p>
                      <small className="text-muted announcement-date">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(announcement.created_at).toLocaleString()}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted">
                  <i className="bi bi-info-circle fs-3 mb-2"></i>
                  <p>暂无公告</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard