import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8085',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if ((err as any)?.code === 'ECONNRESET' || (err as any)?.code === 'EPIPE') {
              return;
            }
            console.warn('[vite ws proxy]', err.message);
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', (err) => {
              if ((err as any)?.code === 'ECONNRESET' || (err as any)?.code === 'EPIPE') {
                return;
              }
              console.warn('[vite ws socket]', err.message);
            });
          });
        },
      }
    }
  }
})
