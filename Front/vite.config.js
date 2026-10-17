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
