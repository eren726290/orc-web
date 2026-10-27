import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Source Apply loads this parser lazily; discovering it mid-edit causes a full dev reload.
  optimizeDeps: { include: ["@codemirror/lang-css"] },
});
