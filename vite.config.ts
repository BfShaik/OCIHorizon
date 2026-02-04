import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.OCI_GENAI_API_KEY': JSON.stringify(env.OCI_GENAI_API_KEY),
        'process.env.OCI_COMPARTMENT_ID': JSON.stringify(env.OCI_COMPARTMENT_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
