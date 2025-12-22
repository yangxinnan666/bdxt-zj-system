import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import logger from '../utils/logger';
import * as XLSX from 'xlsx';

function Admin({ user }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [accountingRecords, setAccountingRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: ''
  });
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 获取所有用户
  const fetchUsers = async () => {
    try {
      console.log('开始获取用户列表...');
      console.log('当前用户信息:', user);
      
      // 检查当前用户是否是管理员
      const isAdmin = user?.user_type === 'admin';
      console.log('当前用户是否是管理员:', isAdmin);
      
      // 从profiles表获取用户基本信息
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('获取用户列表出错:', profilesError);
        console.error('错误代码:', profilesError?.code);
        console.error('错误消息:', profilesError?.message);
        console.error('错误详情:', profilesError?.details);
        throw profilesError;
      }

      console.log('从profiles表获取到的用户数据:', profiles);
      console.log('获取到的用户数量:', profiles?.length || 0);
      
      // 直接使用profiles表中的user_type字段作为用户角色
      const usersWithRoles = profiles.map(profile => ({
        ...profile,
        user_type: profile.user_type || 'user'
      }));

      console.log('获取到带角色的用户数据:', usersWithRoles);
      console.log('最终显示的用户数量:', usersWithRoles.length);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      console.error('错误详情:', error?.stack || error?.message || '未知错误');
    }
  };

  // 获取所有公告
  const fetchAnnouncements = async () => {
    try {
      console.log('开始获取公告列表...');
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取公告列表出错:', error);
        throw error;
      }
      console.log('获取到公告数据:', data);
      setAnnouncements(data);
    } catch (error) {
      console.error('获取公告列表失败:', error);
      console.error('错误详情:', error?.stack || error?.message || '未知错误');
    }
  };

  // 加载所有用户对账记录
  const fetchAccountingRecords = async () => {
    try {
      console.log('开始获取对账记录...');
      const { data, error } = await supabase
        .from('accounting_records')
        .select('*')
        .order('record_time', { ascending: false });
      if (error) {
        console.error('获取对账记录出错:', error);
        throw error;
      }
      console.log('获取到对账记录数据:', data);
      setAccountingRecords(data);
      
      // 计算总收入和总支出
      const income = data.reduce((sum, record) => {
        return record.type === '收入' ? sum + record.amount : sum;
      }, 0);
      const expense = data.reduce((sum, record) => {
        return record.type === '支出' ? sum + record.amount : sum;
      }, 0);
      setTotalIncome(income);
      setTotalExpense(expense);
    } catch (error) {
      console.error('获取对账记录失败:', error);
      console.error('错误详情:', error?.stack || error?.message || '未知错误');
    }
  };

  // 获取所有报单记录
  const fetchOrders = async () => {
    try {
      console.log('开始获取报单记录...');
      // 直接从orders表获取所有订单数据，orders表中已经包含报单人姓名
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('order_time', { ascending: false });
      if (ordersError) {
        console.error('获取报单记录出错:', ordersError);
        throw ordersError;
      }
      console.log('获取到报单记录数据:', ordersData);
      
      // 为了保持与前端显示逻辑一致，将订单的name字段映射到profiles.name结构
      const ordersWithUserNames = ordersData.map(order => ({
        ...order,
        profiles: { name: order.name }
      }));
      
      setOrders(ordersWithUserNames || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('错误详情:', error?.stack || error?.message || '未知错误');
      console.error('错误详情:', error?.stack || error?.message || '未知错误');
    }
  };

  // 加载当前用户资料
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!user) return;
      
      try {
        setLoadingProfile(true);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setCurrentUserProfile(profile);
      } catch (error) {
        console.error('获取当前用户资料失败:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    fetchCurrentUserProfile();
  }, [user]);

  // 加载数据
  useEffect(() => {
    console.log('Admin组件挂载，开始加载数据');
    fetchUsers();
    fetchAnnouncements();
    fetchAccountingRecords();
    fetchOrders();
  }, []);

  // 实时订阅用户列表更新
  useEffect(() => {
    // 订阅profiles表的INSERT和UPDATE事件
    const userSubscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        // 当有新用户注册或用户信息更新时，重新获取用户列表
        fetchUsers();
      })
      .subscribe();

    // 清理订阅
    return () => {
      supabase.removeChannel(userSubscription);
    };
  }, []);

  // 切换用户角色
  const toggleUserRole = async (userId, currentRole) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      fetchUsers(); // 重新加载用户列表
    } catch (error) {
      logger.error('更新用户角色失败', {
        error: error,
        details: error?.stack || error?.message || '未知错误'
      });
      alert('更新角色失败，请重试');
    }
  };

  // 保存公告
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([newAnnouncement]);

      if (error) throw error;

      // 重置表单
      setNewAnnouncement({
        title: '',
        content: ''
      });

      // 重新加载公告
      fetchAnnouncements();
    } catch (error) {
      logger.error('保存公告失败', {
        error: error,
        details: error?.stack || error?.message || '未知错误'
      });
      alert('保存公告失败，请重试');
    }
  };



  // 确认用户删除
  const confirmDeleteUser = (user) => {
    if (window.confirm(`确定要删除用户 ${user.name} 吗？此操作不可恢复。`)) {
      deleteUser(user.id);
    }
  };

  // 删除用户
  const deleteUser = async (userId) => {
    try {
      // 使用Supabase的auth API删除用户
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) throw authError;
      
      fetchUsers(); // 重新加载用户列表
    } catch (error) {
      logger.error('删除用户失败', {
        error: error,
        details: error?.stack || error?.message || '未知错误'
      });
      alert('删除用户失败，请重试');
    }
  };

  // 确认公告删除
  const confirmDeleteAnnouncement = (announcement) => {
    if (window.confirm(`确定要删除公告 "${announcement.title}" 吗？此操作不可恢复。`)) {
      deleteAnnouncement(announcement.id);
    }
  };

  // 删除公告
  const deleteAnnouncement = async (announcementId) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;
      fetchAnnouncements(); // 重新加载公告列表
    } catch (error) {
      logger.error('删除公告失败', {
        error: error,
        details: error?.stack || error?.message || '未知错误'
      });
      alert('删除公告失败，请重试');
    }
  };

  // 导出报单记录到Excel
  const exportOrdersToExcel = () => {
    if (orders.length === 0) {
      alert('没有报单记录可以导出');
      return;
    }

    // 准备导出数据
    const exportData = orders.map(item => ({
      '姓名': item.name,
      '物品': item.item,
      '快递单号': item.tracking_number,
      '时间': new Date(item.order_time).toLocaleString(),
      '状态': item.status,
      '报单人': item.profiles?.name || '未知用户'
    }));

    // 创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '报单记录');

    // 导出文件
    XLSX.writeFile(workbook, `报单记录_${new Date().toLocaleDateString()}.xlsx`);
  };

  // 导出对账记录到Excel
  const exportAccountingToExcel = (type) => {
    // 根据类型筛选记录
    const filteredRecords = accountingRecords.filter(record => record.type === type);
    
    if (filteredRecords.length === 0) {
      alert(`没有${type}记录可以导出`);
      return;
    }

    // 准备导出数据
    const exportData = filteredRecords.map(item => ({
      '姓名': item.name,
      '时间': new Date(item.record_time).toLocaleString(),
      '金额': item.amount,
      '支付方式': item.payment_method,
      '类型': item.type,
      '备注': item.remark || '',
      '记录人': item.user_id || '未知'
    }));

    // 创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${type}记录`);

    // 导出文件
    XLSX.writeFile(workbook, `${type}记录_${new Date().toLocaleDateString()}.xlsx`);
  };

  // 确认删除报单
  const confirmDeleteOrder = (order) => {
    if (window.confirm(`确定要删除报单"${order.item}"吗？此操作不可恢复。`)) {
      deleteOrder(order.id);
    }
  };

  // 删除报单
  const deleteOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders(); // 重新加载报单列表
    } catch (error) {
      console.error('删除报单失败:', error);
      console.error('错误详情:', error?.stack || error?.message || '未知错误');
      alert('删除报单失败，请重试');
    }
  };

  // 确认删除对账记录
  const confirmDeleteAccounting = (record) => {
    if (window.confirm(`确定要删除对账记录"${record.name} - ${record.amount.toFixed(2)}"吗？此操作不可恢复。`)) {
      deleteAccounting(record.id);
    }
  };

  // 删除对账记录
  const deleteAccounting = async (recordId) => {
    try {
      const { error } = await supabase
        .from('accounting_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
      fetchAccountingRecords(); // 重新加载对账记录列表
    } catch (error) {
      logger.error('删除对账记录失败', {
        error: error,
        details: error?.stack || error?.message || '未知错误'
      });
      alert('删除对账记录失败，请重试');
    }
  };

  return (
    <div className="admin-container container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center">
              <i className="bi bi-gear-fill text-primary me-2" style={{ fontSize: '1.5rem' }}></i>
              <h2>系统管理</h2>
            </div>
            {currentUserProfile && (
              <div className="d-flex align-items-center">
                <span className="text-muted me-2">当前用户:</span>
                <span className="font-weight-bold">{currentUserProfile.name || currentUserProfile.email}</span>
                <span className={`badge ml-2 ${currentUserProfile.user_type === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                  {currentUserProfile.user_type === 'admin' ? '管理员' : '普通用户'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex border-bottom">
            <button 
              className={`btn btn-link p-3 ${activeTab === 'users' ? 'border-bottom-2 border-primary text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('users')}
            >
              <i className="bi bi-people-fill me-2"></i>用户管理
            </button>
            <button 
              className={`btn btn-link p-3 ${activeTab === 'announcements' ? 'border-bottom-2 border-primary text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('announcements')}
            >
              <i className="bi bi-megaphone-fill me-2"></i>公告管理
            </button>
            <button 
              className={`btn btn-link p-3 ${activeTab === 'accounting' ? 'border-bottom-2 border-primary text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('accounting')}
            >
              <i className="bi bi-file-earmark-spreadsheet-fill me-2"></i>对账记录
            </button>
            <button 
              className={`btn btn-link p-3 ${activeTab === 'orders' ? 'border-bottom-2 border-primary text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('orders')}
            >
              <i className="bi bi-box-fill me-2"></i>报单管理
            </button>
            <a 
              href="/logs" 
              className="btn btn-link p-3 text-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="bi bi-file-text-fill me-2"></i>日志查看器
            </a>
          </div>
        </div>
      </div>

      {/* 用户管理 */}
      {activeTab === 'users' && (
        <div className="row">
          <div className="col-12">
            <div className="card admin-card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-people-fill text-primary me-2"></i>
                  <h5 className="card-title mb-0">用户管理</h5>
                </div>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead className="thead-light">
                      <tr>
                        <th>姓名</th>
                        <th>邮箱</th>
                        <th>角色</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name || (user.email ? user.email.split('@')[0] : '未知')}</td>
              <td>{user.email}</td>
              <td>
              <span className={`badge ${user.user_type === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                {user.user_type === 'admin' ? '管理员' : '普通用户'}
              </span>
            </td>
                        <td>
                          <button 
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => toggleUserRole(user.id, user.user_type)}
                            >
                              <i className="bi bi-arrow-repeat me-1"></i>切换角色
                            </button>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => confirmDeleteUser(user)}
                              >
                                <i className="bi bi-trash me-1"></i>删除
                              </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {users.length === 0 && (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-people text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                    <p className="mb-0">暂无用户</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 公告管理 */}
      {activeTab === 'announcements' && (
        <div className="row">
          <div className="col-12">
            <div className="card admin-card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-megaphone-fill text-primary me-2"></i>
                  <h5 className="card-title mb-0">公告管理</h5>
                </div>
                
                {/* 发布公告 */}
                <div className="mb-4 p-3 bg-light rounded border border-light">
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-plus-circle-fill text-primary me-2"></i>
                    <h6 className="mb-0">发布新公告</h6>
                  </div>
                  <form onSubmit={handleSaveAnnouncement}>
                    <div className="mb-3">
                      <label htmlFor="announcementTitle" className="form-label">标题</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-card-heading"></i></span>
                        <input
                          type="text"
                          className="form-control"
                          id="announcementTitle"
                          placeholder="请输入公告标题"
                          value={newAnnouncement.title}
                          onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="announcementContent" className="form-label">内容</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-chat-text"></i></span>
                        <textarea
                          className="form-control"
                          id="announcementContent"
                          rows="3"
                          placeholder="请输入公告内容"
                          value={newAnnouncement.content}
                          onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                          required
                        ></textarea>
                      </div>
                    </div>
                
                    <button type="submit" className="btn btn-primary btn-sm d-flex align-items-center">
                      <i className="bi bi-send-fill me-1"></i>发布
                    </button>
                  </form>
                </div>

                {/* 公告列表 */}
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead className="thead-light">
                      <tr>
                        <th>标题</th>
                        <th>状态</th>
                        <th>发布时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements.map((announcement) => (
                        <tr key={announcement.id}>
                          <td>{announcement.title}</td>
                          <td>
                            <span className="badge bg-success">已发布</span>
                          </td>
                          <td>{new Date(announcement.created_at).toLocaleString()}</td>
                          <td>

                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => confirmDeleteAnnouncement(announcement)}
                            >
                              <i className="bi bi-trash me-1"></i>删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {announcements.length === 0 && (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-megaphone text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                    <p className="mb-0">暂无公告</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 报单管理 */}
      {activeTab === 'orders' && (
        <div className="row">
          <div className="col-12">
            <div className="card admin-card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <i className="bi bi-box-fill text-primary me-2"></i>
                    <h5 className="card-title mb-0">报单管理</h5>
                  </div>
                  <div>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => exportOrdersToExcel()}
                    >
                      <i className="bi bi-file-earmark-excel me-1"></i>导出报单表格
                    </button>
                  </div>
                </div>
                
                {/* 报单列表 */}
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead className="thead-light">
                      <tr>
                        <th>姓名</th>
                        <th>物品</th>
                        <th>快递单号</th>
                        <th>时间</th>
                        <th>状态</th>
                        <th>报单人</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.name}</td>
                          <td>{order.item}</td>
                          <td>{order.tracking_number}</td>
                          <td>{new Date(order.order_time).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${order.status === '已发货' ? 'bg-primary' : 'bg-secondary'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>{order.profiles?.name || '未知用户'}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => confirmDeleteOrder(order)}
                              title="删除报单"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {orders.length === 0 && (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-box text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                    <p className="mb-0">暂无报单记录</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 对账记录 */}
      {activeTab === 'accounting' && (
        <div className="row">
          <div className="col-12">
            <div className="card admin-card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <i className="bi bi-file-earmark-spreadsheet-fill text-primary me-2"></i>
                    <h5 className="card-title mb-0">对账记录</h5>
                  </div>
                  <div>
                    <button 
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => exportAccountingToExcel('收入')}
                    >
                      <i className="bi bi-file-earmark-excel me-1"></i>导出收入记录
                    </button>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => exportAccountingToExcel('支出')}
                    >
                      <i className="bi bi-file-earmark-excel me-1"></i>导出支出记录
                    </button>
                  </div>
                </div>
                
                {/* 统计信息 */}
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="card p-3 bg-light rounded text-center">
                      <div className="info-box-content">
                        <i className="bi bi-arrow-up-circle text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <div className="info-box-text text-muted mb-1">总收入</div>
                        <div className="info-box-number h5 text-primary">¥{totalIncome.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card p-3 bg-light rounded text-center">
                      <div className="info-box-content">
                        <i className="bi bi-arrow-down-circle text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <div className="info-box-text text-muted mb-1">总支出</div>
                        <div className="info-box-number h5 text-primary">¥{totalExpense.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card p-3 bg-light rounded text-center">
                      <div className="info-box-content">
                        <i className="bi bi-balance-scale text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                        <div className="info-box-text text-muted mb-1">净收入</div>
                        <div className="info-box-number h5 text-primary">¥{(totalIncome - totalExpense).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 对账记录列表 */}
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead className="thead-light">
                      <tr>
                        <th>姓名</th>
                        <th>时间</th>
                        <th>金额</th>
                        <th>支付方式</th>
                        <th>类型</th>
                        <th>备注</th>
                        <th>记录人</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountingRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{record.name}</td>
                          <td>{new Date(record.record_time).toLocaleString()}</td>
                          <td className={record.type === '收入' ? 'text-primary font-weight-medium' : 'text-primary font-weight-medium'}>
                      {record.type === '收入' ? '+' : '-'}{record.amount.toFixed(2)}
                    </td>
                          <td>
                            <span className={`badge bg-secondary`}>
                              {record.payment_method}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${record.type === '收入' ? 'bg-primary' : 'bg-secondary'}`}>
                              {record.type}
                            </span>
                          </td>
                          <td>{record.remark || '-'}</td>
                          <td>{record.user_id || '未知'}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => confirmDeleteAccounting(record)}
                              title="删除记录"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {accountingRecords.length === 0 && (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-file-earmark-spreadsheet text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                    <p className="mb-0">暂无对账记录</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 系统信息 */}
      <div className="card admin-card mb-4 shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-info-circle-fill text-primary me-2"></i>
            <h5 className="card-title mb-0">系统信息</h5>
          </div>
          <div className="row">
            <div className="col-md-3 col-sm-6">
              <div className="admin-stat-card p-3 bg-light rounded text-center border border-light">
                <div className="info-box-content">
                  <i className="bi bi-people text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                  <div className="info-box-text text-muted mb-1">总用户数</div>
                  <div className="info-box-number h5">{users.length}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="admin-stat-card p-3 bg-light rounded text-center border border-light">
                <div className="info-box-content">
                  <i className="bi bi-person-check text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                  <div className="info-box-text text-muted mb-1">管理员数</div>
                  <div className="info-box-number h5">{users.filter(u => u.user_type === 'admin').length}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="admin-stat-card p-3 bg-light rounded text-center border border-light">
                <div className="info-box-content">
                  <i className="bi bi-megaphone text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                  <div className="info-box-text text-muted mb-1">公告数</div>
                  <div className="info-box-number h5">{announcements.length}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="admin-stat-card p-3 bg-light rounded text-center border border-light">
                <div className="info-box-content">
                  <i className="bi bi-check-circle text-primary mb-2" style={{ fontSize: '1.5rem' }}></i>
                  <div className="info-box-text text-muted mb-1">已发布公告</div>
                  <div className="info-box-number h5">{announcements.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 用户编辑模态框 */}
      {showUserModal && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEditing ? '编辑用户' : '添加用户'}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowUserModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* 用户编辑表单 */}
                <form>
                  <div className="mb-3">
                    <label htmlFor="userName" className="form-label">姓名</label>
                    <input
                      type="text"
                      className="form-control"
                      id="userName"
                      value={selectedUser?.name || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="userEmail" className="form-label">邮箱</label>
                    <input
                      type="email"
                      className="form-control"
                      id="userEmail"
                      value={selectedUser?.email || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="userRole" className="form-label">角色</label>
                    <select
                      className="form-control"
                      id="userRole"
                      value={selectedUser?.user_type || 'user'}
                      onChange={(e) => setSelectedUser({...selectedUser, user_type: e.target.value})}
                    >
                      <option value="user">普通用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                  取消
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setShowUserModal(false)}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;