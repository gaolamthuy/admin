import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom"],
          "antd-vendor": ["antd", "@ant-design/icons"],
          "refine-vendor": [
            "@refinedev/core",
            "@refinedev/antd",
            "@refinedev/react-router",
            "@refinedev/supabase",
          ],
          "supabase-vendor": ["@supabase/supabase-js"],
          "router-vendor": ["react-router-dom"],
          "utils-vendor": ["dayjs"],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Tăng limit để tránh warning
    minify: "esbuild", // Sử dụng esbuild thay vì terser
  },
  define: {
    // Đảm bảo process.env được định nghĩa
    "process.env": {},
  },
});
