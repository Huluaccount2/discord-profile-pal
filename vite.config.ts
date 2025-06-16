
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];
  
  // Only add componentTagger in development mode if the package exists
  if (mode === 'development') {
    try {
      const { componentTagger } = require("lovable-tagger");
      plugins.push(componentTagger());
    } catch (error) {
      console.warn("lovable-tagger not found, continuing without it");
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        port: 8080
      }
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      __WS_TOKEN__: JSON.stringify(process.env.WS_TOKEN || ''),
    }
  };
});
