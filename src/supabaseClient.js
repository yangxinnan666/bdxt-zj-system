import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
// 注意：实际使用时需要替换为您自己的Supabase项目URL和anon key
export const supabase = createClient(
  'https://klgiatuvsyfmcmjwerac.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZ2lhdHV2c3lmbWNtandlcmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjY5MzksImV4cCI6MjA4MTAwMjkzOX0.MMM6eppK0wLWghUaeMhOsjb9btA5onfT3ju6Y8UFDsw',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZ2lhdHV2c3lmbWNtandlcmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjY5MzksImV4cCI6MjA4MTAwMjkzOX0.MMM6eppK0wLWghUaeMhOsjb9btA5onfT3ju6Y8UFDsw'
      },
      fetch: (url, options = {}) => {
        // 增加全局超时设置，统一超时时间到30秒
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时
        
        return fetch(url, {
          ...options,
          signal: controller.signal
        })
        .finally(() => clearTimeout(timeoutId))
      }
    }
  }
)