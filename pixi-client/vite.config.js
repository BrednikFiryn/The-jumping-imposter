import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 8080,
    open: true,
  },

  json: {
    namedExports: true,
    stringify: false,
  },
});
