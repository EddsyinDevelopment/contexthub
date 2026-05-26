import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development the React app is served by Vite on port 5173, while the API
// runs on port 3000. These proxy rules forward API calls to the backend so the
// browser sees same-origin requests — no CORS configuration needed.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/sources": "http://localhost:3000",
      "/context": "http://localhost:3000",
      "/health": "http://localhost:3000",
    },
  },
});
