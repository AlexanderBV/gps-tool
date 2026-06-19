import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_GPS_DEV_PROXY;

  let proxyConfig = {};
  if (proxyTarget) {
    try {
      const origin = new URL(proxyTarget).origin;
      proxyConfig = {
        '/gps-proxy': {
          target: origin,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/gps-proxy/, '')
        }
      };
    } catch {
      console.warn('[vite] VITE_GPS_DEV_PROXY inválido, proxy desactivado:', proxyTarget);
    }
  }

  return {
    plugins: [vue()],
    server: {
      proxy: proxyConfig
    }
  };
});
