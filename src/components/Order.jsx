import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Order({ user }) {
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    item: '',
    tracking_number: '',
    order_time: new Date().toISOString().slice(0, 16),
    status: '未发货'
  })
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)

  // 获取用户资料
  useEffect(() => {
    // 创建默认用户资料
    const createDefaultProfile = async () => {
      try {
        const defaultProfile = {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0],
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
          name: user.email.split('@')[0],
          user_type: 'user'
        };
        setProfile(defaultProfile);
        // 保存到本地存储
        localStorage.setItem('bdxt.profile', JSON.stringify(defaultProfile));
      }
    };

    const fetchProfile = async () => {
      try {
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
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
        
        // 将用户资料保存到本地存储
        try {
          localStorage.setItem('bdxt.profile', JSON.stringify(profile));
        } catch (localError) {
          console.error('保存用户资料到本地存储失败:', localError);
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
        
        // 尝试从本地存储读取用户资料
        if (error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
          try {
            const savedProfile = localStorage.getItem('bdxt.profile');
            if (savedProfile) {
              const parsedProfile = JSON.parse(savedProfile);
              setProfile(parsedProfile);
              console.log('从本地存储恢复用户资料成功');
            } else {
              console.log('本地存储中没有用户资料，创建默认资料');
              await createDefaultProfile();
            }
          } catch (localError) {
            console.error('从本地存储读取用户资料失败:', localError);
            await createDefaultProfile();
          }
        } else {
          // 创建默认用户资料
          await createDefaultProfile();
        }
      }
    }
    
    fetchProfile()
  }, [user.id])

  // 当用户资料加载完成后，自动填充姓名
  useEffect(() => {
    if (profile && profile.name) {
      setFormData(prev => ({ ...prev, name: profile.name }));
    }
  }, [profile]);

  // 获取报单记录
  useEffect(() => {
    fetchOrders()
  }, [user.id, profile])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      console.log('开始获取报单记录');
      console.log('用户信息:', user);
      console.log('用户资料:', profile);
      
      // 设置请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        let query = supabase
          .from('orders')
          .select('*')
          .order('order_time', { ascending: false })
          .abortSignal(controller.signal);
        
        // 如果是普通用户，只显示自己的报单；如果是管理员，显示所有报单
        if (profile && profile.user_type !== 'admin') {
          console.log('普通用户，只查询自己的报单');
          query = query.eq('user_id', user.id)
        } else {
          console.log('管理员，查询所有报单');
        }
        
        console.log('执行报单查询...');
        const { data, error } = await query
        console.log('报单查询结果:', { data, error });
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        const ordersData = data || [];
        setOrders(ordersData)
        console.log('获取报单记录成功');
        
        // 将报单数据保存到本地存储
        try {
          localStorage.setItem('bdxt.orders', JSON.stringify(ordersData));
        } catch (localError) {
          console.error('保存报单记录到本地存储失败:', localError);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('获取报单记录超时');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('错误类型:', typeof error);
      console.error('错误详情:', error?.stack || error?.message || '未知错误');
      
      // 当网络请求失败时，尝试从本地存储读取报单记录
      if (error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
        console.log('尝试从本地存储读取报单记录...');
        try {
          const savedOrders = localStorage.getItem('bdxt.orders');
          if (savedOrders) {
            const parsedOrders = JSON.parse(savedOrders);
            // 根据用户类型筛选记录
            let filteredOrders = parsedOrders;
            if (profile && profile.user_type !== 'admin') {
              filteredOrders = parsedOrders.filter(order => order.user_id === user.id);
            }
            setOrders(filteredOrders);
            console.log('从本地存储恢复报单记录成功');
            // 清除错误信息，让用户可以继续使用本地数据
            setError('');
          } else {
            console.log('本地存储中没有报单记录');
            setOrders([]);
            setError('网络请求失败，但您可以继续创建新报单（将保存在本地）');
          }
        } catch (localError) {
          console.error('从本地存储读取报单记录失败:', localError);
          setOrders([]);
          setError('获取报单记录失败');
        }
      } else {
        setError('获取报单记录失败');
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      console.log('准备保存报单:', { user_id: user.id, ...formData })
      const { data, error } = await supabase.from('orders').insert({
        user_id: user.id,
        ...formData
      })

      if (error) {
        console.error('Supabase插入错误:', error)
        setError(`保存报单记录失败: ${error.message}`)
        return
      }

      console.log('保存成功:', data)
      // 重置表单
      setFormData({
        name: '',
        item: '',
        tracking_number: '',
        order_time: new Date().toISOString().slice(0, 16),
        status: '未发货'
      })

      // 重新获取记录
      fetchOrders()
    } catch (error) {
      console.error('保存报单异常:', error)
      setError(`保存报单记录失败: ${error.message || '未知错误'}`)
    }
  }

  const handleDelete = async (id, orderUserId) => {
    // 检查权限：只有管理员或报单所有者可以删除
    if (profile && (profile.user_type === 'admin' || orderUserId === user.id)) {
      if (window.confirm('确定要删除这条报单记录吗？')) {
        try {
          await supabase.from('orders').delete().eq('id', id)
          fetchOrders()
        } catch (error) {
          setError('删除报单记录失败')
          console.error('Error deleting order:', error)
        }
      }
    } else {
      setError('您没有权限删除这条报单记录')
    }
  }

  const handleStatusUpdate = async (id, newStatus, orderUserId) => {
    // 检查权限：只有管理员或报单所有者可以更新状态
    if (profile && (profile.user_type === 'admin' || orderUserId === user.id)) {
      try {
        await supabase.from('orders').update({
          status: newStatus
        }).eq('id', id)
        fetchOrders()
      } catch (error) {
        setError('更新状态失败')
        console.error('Error updating status:', error)
      }
    } else {
      setError('您没有权限更新这条报单记录的状态')
    }
  }

  if (loading && !profile) {
    return <div className="container mt-5">加载中...</div>
  }

  return (
    <div className="container mt-5 order-container">
      <div className="row">
        {/* 侧边导航 */}
        <div className="col-md-3 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center mb-4">
                <i className="bi bi-list-ul me-2 text-primary"></i>
                <h5 className="card-title mb-0">导航菜单</h5>
              </div>
              <nav className="nav flex-column">
                <Link to="/dashboard" className="nav-link dashboard-nav-link">
                  <i className="bi bi-house me-2"></i>首页
                </Link>
                <Link to="/accounting" className="nav-link dashboard-nav-link">
                  <i className="bi bi-calculator me-2"></i>对账系统
                </Link>
                <Link to="/order" className="nav-link dashboard-nav-link active">
                  <i className="bi bi-box me-2"></i>报单系统
                </Link>
                {profile?.user_type === 'admin' && (
                  <Link to="/admin" className="nav-link dashboard-nav-link">
                    <i className="bi bi-gear me-2"></i>管理中心
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>

        {/* 主内容 */}
        <div className="col-md-9">
          <div className="card order-card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center mb-4">
                <i className="bi bi-box me-2 text-primary" style={{ fontSize: '1.5rem' }}></i>
                <h3 className="card-title mb-0">报单系统</h3>
              </div>
              
              {/* 表单 */}
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-plus-circle me-2 text-primary"></i>
                <h4 className="mb-0">添加报单</h4>
              </div>
              {error && (
                <div className="alert alert-primary" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="order-form">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="name" className="form-label">
                      <i className="bi bi-person me-2"></i>姓名
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-person"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="请输入姓名"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="item" className="form-label">
                      <i className="bi bi-box-seam me-2"></i>物品
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-box-seam"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        id="item"
                        name="item"
                        value={formData.item}
                        onChange={handleInputChange}
                        placeholder="请输入物品名称"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="tracking_number" className="form-label">
                      <i className="bi bi-truck me-2"></i>快递单号
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-truck"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        id="tracking_number"
                        name="tracking_number"
                        value={formData.tracking_number}
                        onChange={handleInputChange}
                        placeholder="请输入快递单号"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="order_time" className="form-label">
                      <i className="bi bi-calendar me-2"></i>时间
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-calendar"></i>
                      </span>
                      <input
                        type="datetime-local"
                        className="form-control"
                        id="order_time"
                        name="order_time"
                        value={formData.order_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">
                    <i className="bi bi-clipboard-check me-2"></i>发货状态
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-clipboard-check"></i>
                    </span>
                    <select
                      className="form-select"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="未发货">未发货</option>
                      <option value="已发货">已发货</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg">
                  <i className="bi bi-save me-2"></i>保存
                </button>
              </form>
            </div>
          </div>

          {/* 报单列表 */}
          <div className="card order-card shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-list me-2 text-primary"></i>
                <h4 className="card-title mb-0">报单列表</h4>
              </div>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">加载中...</span>
                  </div>
                </div>
              ) : orders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th>姓名</th>
                        <th>物品</th>
                        <th>快递单号</th>
                        <th>时间</th>
                        <th>发货状态</th>
                        {profile && profile.user_type === 'admin' && <th>报单人</th>}
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="table-row">
                          <td>{order.name}</td>
                          <td>{order.item}</td>
                          <td>{order.tracking_number}</td>
                          <td>{new Date(order.order_time).toLocaleString()}</td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value, order.user_id)}
                              style={{ maxWidth: '120px' }}
                            >
                              <option value="未发货">未发货</option>
                              <option value="已发货">已发货</option>
                            </select>
                          </td>
                          {profile && profile.user_type === 'admin' && (
                            <td>用户{(order.user_id || '').substring(0, 8)}...</td>
                          )}
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleDelete(order.id, order.user_id)}
                              title="删除"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-inbox-fill text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-3 text-muted">暂无报单记录</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Order