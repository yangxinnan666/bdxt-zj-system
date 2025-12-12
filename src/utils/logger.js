// 日志管理工具
class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100; // 最大日志条数
    this.level = 'debug'; // 日志级别：debug, info, warn, error
  }

  // 设置日志级别
  setLevel(level) {
    this.level = level;
  }

  // 添加日志
  addLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    this.logs.push(logEntry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // 移除最早的日志
    }

    // 保存到本地存储
    this.saveToLocalStorage();
  }

  // 调试日志
  debug(message, data = null) {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, data);
      this.addLog('debug', message, data);
    }
  }

  // 信息日志
  info(message, data = null) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, data);
      this.addLog('info', message, data);
    }
  }

  // 警告日志
  warn(message, data = null) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data);
      this.addLog('warn', message, data);
    }
  }

  // 错误日志
  error(message, data = null) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, data);
      this.addLog('error', message, data);
    }
  }

  // 检查是否应该记录该级别的日志
  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  // 获取所有日志
  getAllLogs() {
    return [...this.logs];
  }

  // 按级别获取日志
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  // 按时间范围获取日志
  getLogsByTimeRange(startTime, endTime) {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= startTime && logTime <= endTime;
    });
  }

  // 清空日志
  clearLogs() {
    this.logs = [];
    this.saveToLocalStorage();
  }

  // 保存日志到本地存储
  saveToLocalStorage() {
    try {
      localStorage.setItem('bdxt.logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('保存日志到本地存储失败:', error);
    }
  }

  // 从本地存储加载日志
  loadFromLocalStorage() {
    try {
      const savedLogs = localStorage.getItem('bdxt.logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('从本地存储加载日志失败:', error);
    }
  }

  // 导出日志
  exportLogs() {
    const logsData = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bdxt-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// 创建单例实例
const logger = new Logger();

// 初始化时加载日志
logger.loadFromLocalStorage();

export default logger;
