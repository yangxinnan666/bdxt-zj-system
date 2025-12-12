import { useState, useEffect } from 'react';
import logger from '../utils/logger';

function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });

  // 加载日志
  const loadLogs = () => {
    const allLogs = logger.getAllLogs();
    setLogs(allLogs);
  };

  // 组件挂载时加载日志
  useEffect(() => {
    loadLogs();
  }, []);

  // 筛选日志
  const filteredLogs = logs.filter(log => {
    // 按级别筛选
    if (filterLevel !== 'all' && log.level !== filterLevel) {
      return false;
    }

    // 按搜索词筛选
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // 按日期范围筛选
    const logTime = new Date(log.timestamp).getTime();
    if (dateRange.start && logTime < dateRange.start.getTime()) {
      return false;
    }
    if (dateRange.end && logTime > dateRange.end.getTime()) {
      return false;
    }

    return true;
  });

  // 清空日志
  const handleClearLogs = () => {
    if (window.confirm('确定要清空所有日志吗？')) {
      logger.clearLogs();
      loadLogs();
    }
  };

  // 导出日志
  const handleExportLogs = () => {
    logger.exportLogs();
  };

  // 获取日志级别颜色
  const getLevelColor = (level) => {
    switch (level) {
      case 'debug': return 'text-blue-600';
      case 'info': return 'text-green-600';
      case 'warn': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 格式化日期
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">日志查看器</h1>

        {/* 控制面板 */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜索框 */}
          <div>
            <input
              type="text"
              placeholder="搜索日志..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 级别筛选 */}
          <div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有级别</option>
              <option value="debug">调试</option>
              <option value="info">信息</option>
              <option value="warn">警告</option>
              <option value="error">错误</option>
            </select>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              刷新日志
            </button>
            <button
              onClick={handleClearLogs}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              清空日志
            </button>
            <button
              onClick={handleExportLogs}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              导出日志
            </button>
          </div>
        </div>

        {/* 日期范围选择 */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="datetime-local"
              value={dateRange.start ? dateRange.start.toISOString().slice(0, 16) : ''}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value ? new Date(e.target.value) : null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="datetime-local"
              value={dateRange.end ? dateRange.end.toISOString().slice(0, 16) : ''}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value ? new Date(e.target.value) : null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 日志统计 */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">日志统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">总日志数</div>
              <div className="text-xl font-bold text-gray-800">{logs.length}</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">错误日志</div>
              <div className="text-xl font-bold text-red-600">{logs.filter(log => log.level === 'error').length}</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">警告日志</div>
              <div className="text-xl font-bold text-yellow-600">{logs.filter(log => log.level === 'warn').length}</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">信息日志</div>
              <div className="text-xl font-bold text-green-600">{logs.filter(log => log.level === 'info').length}</div>
            </div>
          </div>
        </div>

        {/* 日志列表 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  级别
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  消息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  详情
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelColor(log.level)} bg-opacity-20`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-500 max-w-xs">
                      {log.data ? JSON.stringify(log.data, null, 2) : '无详情'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    没有找到匹配的日志
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LogViewer;
