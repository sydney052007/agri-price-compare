import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // WSL 掛載的 Windows 磁碟（/mnt/c/...）通常不支援 inotify，
        // 用輪詢模式監控檔案變化，否則存檔後 HMR 不會生效。
        watch: {
          usePolling: true,
          interval: 300,
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
