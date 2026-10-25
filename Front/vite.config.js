import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 루트 .env의 VITE_API_URL을 프론트 빌드와 개발 서버에서 사용한다.
  envDir: '..',

  /* 빌드 결과물을 publish/ 폴더로 출력 */
  build: {
    outDir: 'publish',
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Vite 8 (rolldown): manualChunks 는 객체 불가 → 함수만 허용
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('framer-motion')) return 'motion'
          if (
            id.includes('/react/')
            || id.includes('/react-dom/')
            || id.includes('/react-router')
            || id.includes('\\react\\')
            || id.includes('\\react-dom\\')
            || id.includes('\\react-router')
          ) {
            return 'react'
          }
          return undefined
        },
      },
    },
  },

  /* @ → src 경로 별칭 */
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
    },
  },

  /* 개발 서버 설정 */
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
