import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { appIconPlugin } from './vite-app-icon-plugin.js';

export default defineConfig({
  plugins: [react(), tailwindcss(), appIconPlugin()],
  server: {
    port: 5173,
    open: true,
  },
});
