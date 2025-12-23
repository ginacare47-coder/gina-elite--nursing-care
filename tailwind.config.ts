import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 12px 30px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        ink: {
          50: "#f5f7fb",
          100: "#eef2f8",
          200: "#d8e1f0",
          300: "#b3c4df",
          400: "#7d9bc4",
          500: "#4e73a3",
          600: "#355a88",
          700: "#28466b",
          800: "#1d3450",
          900: "#14243a",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
