import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

function Accounting({ user }) {
  const [records, setRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({
    name: '',
    record_time: new Date().toISOString().slice(0, 16),
    amount: '',
    payment_method: '支付宝',
    type: '收入',
    remark: ''
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    record_time: '',
    amount: '',
    payment_method: '',
    type: '',
    remark: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: '',
    end: ''
  });

  // 用户资料状态
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // 获取对账记录
  const fetchRecords = async () => {
    try {
      console.log('开始获取对账记录');
      console.log('用户信息:', user);
      console.log('用户资料:', profile);
      
      // 设置请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        let query = supabase
          .from('accounting_records')
          .select('*')
          .order('record_time', { ascending: false })
          .abortSignal(controller.signal);
        
        // 如果是普通用户，只显示自己的记录；如果是管理员，显示所有记录
        if (profile && profile.user_type !== 'admin') {
          console.log('普通用户，只查询自己的记录');
          query = query.eq('user_id', user.id);
        } else {
          console.log('管理员，查询所有记录');
        }
        
        console.log('执行查询...');
        const { data, error } = await query;
        console.log('查询结果:', { data, error });
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        setRecords(data);
        console.log('获取记录成功');
        
        // 将记录保存到本地存储
        try {
          localStorage.setItem('bdxt.accountingRecords', JSON.stringify(data));
        } catch (localError) {
          console.error('保存记录到本地存储失败:', localError);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('获取记录超时');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('获取记录失败:', error);
      console.error('错误类型:', typeof error);
      console.error('错误详情:', error?.stack || error?.message || '未知错误');
      
      // 当网络请求失败时，尝试从本地存储读取记录
      if (error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
        console.log('尝试从本地存储读取对账记录...');
        try {
          const savedRecords = localStorage.getItem('bdxt.accountingRecords');
          if (savedRecords) {
            const parsedRecords = JSON.parse(savedRecords);
            // 根据用户类型筛选记录
            let filteredRecords = parsedRecords;
            if (profile && profile.user_type !== 'admin') {
              filteredRecords = parsedRecords.filter(record => record.user_id === user.id);
            }
            setRecords(filteredRecords);
            console.log('从本地存储恢复对账记录成功');
          } else {
            console.log('本地存储中没有对账记录');
            setRecords([]);
          }
        } catch (localError) {
          console.error('从本地存储读取对账记录失败:', localError);
          setRecords([]);
        }
        // 不弹出警报，让用户可以继续使用本地数据
      }
    }
  };

  // 计算统计数据
  useEffect(() => {
    if (records.length === 0) return;

    const income = records
      .filter(record => record.type === '收入')
      .reduce((sum, record) => sum + parseFloat(record.amount), 0);

    const expense = records
      .filter(record => record.type === '支出')
      .reduce((sum, record) => sum + parseFloat(record.amount), 0);

    setTotalIncome(income);
    setTotalExpense(expense);
  }, [records]);

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
        } else {
          console.log('创建默认用户资料成功:', data);
          setProfile(data);
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
      }
    };

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)

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
      } catch (error) {
        setProfileError('获取用户资料失败')
        console.error('Error fetching profile:', error)
        // 创建默认用户资料
        await createDefaultProfile();
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user.id])

  // 当用户资料加载完成后，自动填充姓名
  useEffect(() => {
    if (profile && profile.name) {
      setNewRecord(prev => ({ ...prev, name: profile.name }));
    }
  }, [profile]);

  // 加载数据
  useEffect(() => {
    fetchRecords();
  }, [profile]); // 当用户资料加载完成后重新获取记录

  // 打开编辑模态框
  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditFormData({
      name: record.name,
      record_time: record.record_time.slice(0, 16),
      amount: record.amount.toString(),
      payment_method: record.payment_method,
      type: record.type,
      remark: record.remark
    });
    setShowEditModal(true);
  };

  // 保存修改
  const handleSaveEdit = async () => {
    try {
      // 构建查询
      let query = supabase
        .from('accounting_records')
        .update({
          ...editFormData,
          amount: parseFloat(editFormData.amount)
        })
        .eq('id', editingRecord.id);
      
      // 如果是普通用户，只能修改自己的记录
      if (profile && profile.user_type !== 'admin') {
        query = query.eq('user_id', user.id);
      }
      
      const { error } = await query;

      if (error) throw error;

      // 关闭模态框并重新加载数据
      setShowEditModal(false);
      fetchRecords();
    } catch (error) {
      console.error('修改记录失败:', error);
      alert('修改记录失败，请重试');
    }
  };

  // 保存新记录
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('accounting_records')
        .insert([{
          ...newRecord,
          user_id: user.id,
          amount: parseFloat(newRecord.amount)
        }]);

      if (error) throw error;

      // 重置表单
      setNewRecord({
        name: '',
        record_time: new Date().toISOString().slice(0, 16),
        amount: '',
        payment_method: '支付宝',
        type: '收入',
        remark: ''
      });

      // 重新加载数据
      fetchRecords();
    } catch (error) {
      console.error('保存记录失败:', error);
      alert('保存记录失败，请重试');
    }
  };

  // 删除记录相关状态
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 打开删除确认模态框
  const handleDeleteClick = (record) => {
    setDeletingRecord(record);
    setShowDeleteModal(true);
  };

  // 确认删除记录
  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;

    try {
      // 构建查询
      let query = supabase
        .from('accounting_records')
        .delete()
        .eq('id', deletingRecord.id);
      
      // 如果是普通用户，只能删除自己的记录
      if (profile && profile.user_type !== 'admin') {
        query = query.eq('user_id', user.id);
      }
      
      const { error } = await query;

      if (error) throw error;

      // 关闭模态框并重新加载数据
      setShowDeleteModal(false);
      fetchRecords();
      setDeletingRecord(null);
    } catch (error) {
      console.error('删除记录失败:', error);
      alert('删除记录失败，请重试');
    }
  };

  // 导出收入表格
  const exportIncomeExcel = () => {
    const incomeData = records.filter(record => record.type === '收入');
    exportToExcel(incomeData, '收入记录');
  };

  // 导出支出表格
  const exportExpenseExcel = () => {
    const expenseData = records.filter(record => record.type === '支出');
    exportToExcel(expenseData, '支出记录');
  };

  // 导出Excel函数
  const exportToExcel = (data, filename) => {
    if (data.length === 0) {
      alert('没有数据可以导出');
      return;
    }

    // 准备导出数据
    const exportData = data.map(item => ({
      '姓名': item.name,
      '时间': new Date(item.record_time).toLocaleString(),
      '金额': item.amount,
      '支付方式': item.payment_method,
      '类型': item.type,
      '备注': item.remark || ''
    }));

    // 创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '记录');

    // 导出文件
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // 筛选记录
  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.record_time);
    const startDate = selectedDateRange.start ? new Date(selectedDateRange.start) : null;
    const endDate = selectedDateRange.end ? new Date(selectedDateRange.end) : null;

    if (!startDate && !endDate) return true;
    if (startDate && endDate) {
      return recordDate >= startDate && recordDate <= endDate;
    }
    if (startDate) {
      return recordDate >= startDate;
    }
    if (endDate) {
      return recordDate <= endDate;
    }
    return true;
  });

  return (
    <div className="container mt-4 accounting-container">
      <div className="text-center mb-4">
        <i className="bi bi-calculator fs-2 text-primary mb-2"></i>
        <h2 className="mb-1">对账系统</h2>
        <p className="text-muted">管理收入和支出记录</p>
      </div>

      {/* 统计信息 */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card accounting-card shadow-sm">
            <div className="card-body text-center">
              <div className="icon-income mb-3">
              <i className="bi bi-arrow-up-circle fs-1 text-primary"></i>
            </div>
            <h5 className="card-title">总收入</h5>
            <p className="card-text display-4 text-primary">¥{totalIncome.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card accounting-card shadow-sm">
            <div className="card-body text-center">
              <div className="icon-expense mb-3">
              <i className="bi bi-arrow-down-circle fs-1 text-primary"></i>
            </div>
            <h5 className="card-title">总支出</h5>
            <p className="card-text display-4 text-primary">¥{totalExpense.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card accounting-card shadow-sm">
            <div className="card-body text-center">
              <div className="icon-balance mb-3">
              <i className="bi bi-cash-coin fs-1 text-primary"></i>
            </div>
            <h5 className="card-title">结余</h5>
            <p className="card-text display-4 text-primary">¥{(totalIncome - totalExpense).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 日期筛选 */}
      <div className="card accounting-card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-calendar-date me-2 text-primary"></i>
            <h5 className="card-title mb-0">日期筛选</h5>
          </div>
          <div className="row">
            <div className="col-md-5">
              <div className="form-group">
                <label className="form-label">开始日期</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-calendar-date"></i>
                  </span>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={selectedDateRange.start}
                    onChange={(e) => setSelectedDateRange({...selectedDateRange, start: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-5">
              <div className="form-group">
                <label className="form-label">结束日期</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-calendar-date"></i>
                  </span>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={selectedDateRange.end}
                    onChange={(e) => setSelectedDateRange({...selectedDateRange, end: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-primary btn-block"
                onClick={() => setSelectedDateRange({start: '', end: ''})}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>重置
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 录入表单 */}
      <div className="card accounting-card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-file-earmark-plus me-2 text-primary"></i>
            <h5 className="card-title mb-0">录入对账信息</h5>
          </div>
          <form onSubmit={handleSaveRecord} className="accounting-form">
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="bi bi-person me-2"></i>姓名
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      value={newRecord.name}
                      onChange={(e) => setNewRecord({...newRecord, name: e.target.value})}
                      placeholder="请输入姓名"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="bi bi-clock me-2"></i>时间
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-clock"></i>
                    </span>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={newRecord.record_time}
                      onChange={(e) => setNewRecord({...newRecord, record_time: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="bi bi-currency-yuan me-2"></i>金额
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-currency-yuan"></i>
                    </span>
                    <input
                      type="number"
                      className="form-control"
                      value={newRecord.amount}
                      onChange={(e) => setNewRecord({...newRecord, amount: e.target.value})}
                      min="0"
                      step="0.01"
                      placeholder="请输入金额"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="bi bi-credit-card me-2"></i>支付方式
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-credit-card"></i>
                    </span>
                    <select
                      className="form-select"
                      value={newRecord.payment_method}
                      onChange={(e) => setNewRecord({...newRecord, payment_method: e.target.value})}
                    >
                      <option value="支付宝">支付宝</option>
                      <option value="微信">微信</option>
                      <option value="银行卡">银行卡</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="bi bi-arrow-up-down me-2"></i>类型
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-arrow-up-down"></i>
                    </span>
                    <select
                      className="form-select"
                      value={newRecord.type}
                      onChange={(e) => setNewRecord({...newRecord, type: e.target.value})}
                    >
                      <option value="收入">收入</option>
                      <option value="支出">支出</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="bi bi-chat-square-text me-2"></i>备注
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-chat-square-text"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      value={newRecord.remark}
                      onChange={(e) => setNewRecord({...newRecord, remark: e.target.value})}
                      placeholder="请输入备注（可选）"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-100 mt-2">
              <i className="bi bi-save me-2"></i>保存
            </button>
          </form>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="card accounting-card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <i className="bi bi-table me-2 text-primary"></i>
              <h5 className="card-title mb-0">对账记录</h5>
            </div>
            <div>
              <button className="btn btn-primary mr-2" onClick={exportIncomeExcel}>
                <i className="bi bi-download me-1"></i>导出收入表格
              </button>
              <button className="btn btn-primary" onClick={exportExpenseExcel}>
                <i className="bi bi-download me-1"></i>导出支出表格
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="thead-light">
                <tr>
                  <th>姓名</th>
                  <th>时间</th>
                  <th>金额</th>
                  <th>支付方式</th>
                  <th>类型</th>
                  <th>备注</th>
                  {profile && profile.user_type === 'admin' && <th>记录人</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="table-row">
                    <td>{record.name}</td>
                    <td>{new Date(record.record_time).toLocaleString()}</td>
                    <td className={`font-weight-medium ${record.type === '收入' ? 'text-primary' : 'text-primary'}`}>
                      {record.type === '收入' ? '+' : '-'}{record.amount}
                    </td>
                    <td>
                      <span className={`badge bg-secondary`}>
                        {record.payment_method}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-primary`}>
                        {record.type}
                      </span>
                    </td>
                    <td>{record.remark || '-'}</td>
                    {profile && profile.user_type === 'admin' && (
                      <td>用户{(record.user_id || '').substring(0, 8)}...</td>
                    )}
                    <td>
                      <button 
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEditClick(record)}
                      >
                        <i className="bi bi-pencil"></i> 编辑
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteClick(record)}
                      >
                        <i className="bi bi-trash"></i> 删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-inbox-fill text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="mt-3 text-muted">暂无记录</p>
            </div>
          )}
        </div>
      </div>

      {/* 编辑记录模态框 */}
      <div className={`modal fade ${showEditModal ? 'show' : ''}`} style={{ display: showEditModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">编辑对账记录</h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowEditModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <form className="accounting-form">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">姓名</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-person"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                          placeholder="请输入姓名"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">时间</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-clock"></i>
                        </span>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={editFormData.record_time}
                          onChange={(e) => setEditFormData({...editFormData, record_time: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">金额</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-currency-yuan"></i>
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          value={editFormData.amount}
                          onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})}
                          min="0"
                          step="0.01"
                          placeholder="请输入金额"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">支付方式</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-credit-card"></i>
                        </span>
                        <select
                          className="form-select"
                          value={editFormData.payment_method}
                          onChange={(e) => setEditFormData({...editFormData, payment_method: e.target.value})}
                        >
                          <option value="支付宝">支付宝</option>
                          <option value="微信">微信</option>
                          <option value="银行卡">银行卡</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">类型</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-arrow-up-down"></i>
                        </span>
                        <select
                          className="form-select"
                          value={editFormData.type}
                          onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                        >
                          <option value="收入">收入</option>
                          <option value="支出">支出</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">备注</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-chat-square-text"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.remark}
                          onChange={(e) => setEditFormData({...editFormData, remark: e.target.value})}
                          placeholder="请输入备注（可选）"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                取消
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSaveEdit}
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认模态框 */}
      <div className={`modal fade ${showDeleteModal ? 'show' : ''}`} style={{ display: showDeleteModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">确认删除</h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowDeleteModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              确定要删除这条对账记录吗？此操作不可恢复。
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                取消
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Accounting;