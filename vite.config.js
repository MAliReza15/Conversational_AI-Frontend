import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    const apiBase = env.VITE_API_BASE_URL || "http://localhost:8000";
    const wsBase = env.VITE_WS_BASE_URL || "ws://localhost:8000";
    const port = parseInt(env.VITE_PORT || "5173", 10);

    return {
        plugins: [react()],
        server: {
            host: "::",
            port,
            proxy: {
                "/session": apiBase,
                "/ws": {
                    target: wsBase,
                    ws: true,
                },
            },
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});
