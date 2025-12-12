import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    open: true
  },
  base: './',
  // 构建优化配置
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动拆分大型依赖
        manualChunks: {
          // 将React相关依赖拆分为单独的chunk
          react: ['react', 'react-dom', 'react-router-dom'],
          // 将Supabase相关依赖拆分为单独的chunk
          supabase: ['@supabase/supabase-js'],
          // 将Bootstrap相关依赖拆分为单独的chunk
          bootstrap: ['bootstrap', 'bootstrap/dist/css/bootstrap.min.css']
        }
      }
    },
    // 增加chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用gzip压缩
    assetsDir: 'assets',
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 优化静态资源
    assetsInlineLimit: 4096, // 小于4KB的资源内联
    // 生成source map以帮助调试
    sourcemap: true
  }
})