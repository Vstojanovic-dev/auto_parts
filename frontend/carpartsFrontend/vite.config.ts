import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Running Vite inside `carparts_frontend` container, backend is `carparts_backend`
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://carparts_backend:80', // IMPORTANT: service name + port 80
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
