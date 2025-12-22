import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        // 登录
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (signInError) throw signInError
        
        // 更新本地存储
        if (data?.user) {
          localStorage.setItem('supabase.auth.user', JSON.stringify(data.user))
        }
        
        navigate('/dashboard')
      } else {
        // 注册
        console.log('开始注册用户...');
        console.log('邮箱:', email);
        console.log('密码:', password);
        console.log('用户名:', username);
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        })

        console.log('注册返回数据:', data);
        console.log('注册错误:', signUpError);
        
        if (signUpError) {
          console.error('注册失败:', signUpError);
          throw signUpError;
        }

        // 创建或更新用户资料
        if (data && data.user) {
          console.log('用户对象存在，准备创建用户资料...');
          console.log('用户ID:', data.user.id);
          
          // 创建profiles记录
          console.log('正在创建profiles记录...');
          try {
            // 只插入数据库表实际需要的字段
            const { data: profileData, error: profileError } = await supabase.from('profiles').upsert({
              id: data.user.id,
              email: email,
              user_type: 'user' // 默认用户类型
            }, { returning: 'representation' })
            
            if (profileError) {
              console.error('创建profiles记录失败:', profileError);
              console.error('profiles错误代码:', profileError?.code);
              console.error('profiles错误消息:', profileError?.message);
              console.error('profiles错误详情:', profileError?.details);
            } else {
              console.log('创建profiles记录成功:', profileData);
            }
          } catch (profileException) {
            console.error('创建profiles记录时发生异常:', profileException);
          }
          
          // 创建roles记录
          console.log('正在创建roles记录...');
          try {
            const { data: roleData, error: roleError } = await supabase.from('roles').upsert({
              user_id: data.user.id,
              role: 'user' // 默认角色
            }, { returning: 'representation' })
            
            if (roleError) {
              console.error('创建roles记录失败:', roleError);
              console.error('roles错误代码:', roleError?.code);
              console.error('roles错误消息:', roleError?.message);
              console.error('roles错误详情:', roleError?.details);
            } else {
              console.log('创建roles记录成功:', roleData);
            }
          } catch (roleException) {
            console.error('创建roles记录时发生异常:', roleException);
          }
          
          // 更新本地存储
          localStorage.setItem('supabase.auth.user', JSON.stringify(data.user))
        } else {
          console.error('用户对象不存在:', data);
        }

        navigate('/dashboard')
      }
    } catch (error) {
      console.error('认证过程发生错误:', error)
      console.error('错误类型:', typeof error)
      console.error('错误完整信息:', JSON.stringify(error, null, 2))
      console.error('错误代码:', error?.code)
      console.error('错误细节:', error?.details)
      console.error('错误提示:', error?.hint)
      setError(error?.message || '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* 左侧登录表单 */}
        <div className="login-left">
          <div className="login-content">
            <div className="login-header text-center mb-5">
              <div className="login-icon mb-3">
                <i className="bi bi-shield-lock fs-1"></i>
              </div>
              <h2 className="card-title mb-1">
                {isLogin ? '登录' : '注册'}
              </h2>
              <p className="text-muted">
                {isLogin ? '请输入您的账号信息' : '创建新账号'}
              </p>
            </div>
            
            {error && (
              <div className="alert alert-danger mb-4">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="login-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    用户名
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入用户名"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  邮箱
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱地址"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  密码
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn login-btn w-100"
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <i className="bi bi-arrow-repeat bi-spin me-2"></i>处理中...
                  </span>
                ) : (
                  <span>
                    {isLogin ? '登录' : '注册'}
                  </span>
                )}
              </button>

              <div className="text-center mt-4">
                <p className="text-muted mb-0">
                  {isLogin ? '没有账号？' : '已有账号？'}
                  <button
                    className="btn btn-link ms-1"
                    onClick={() => setIsLogin(!isLogin)}
                    disabled={loading}
                  >
                    {isLogin ? '点击注册' : '点击登录'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
        
        {/* 右侧注册提示 */}
        <div className="login-right">
          <div className="login-right-content text-center">
            <h3 className="login-right-title">{isLogin ? '没有账号？' : '已有账号？'}</h3>
            <p className="login-right-desc">
              {isLogin ? '立即注册账号，享受我们的所有服务' : '登录您的账号，继续您的体验'}
            </p>
            <button
              className="btn login-toggle-btn"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? '注册' : '登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login