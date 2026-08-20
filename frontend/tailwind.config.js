/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        arcane: {
          50: "#f2efff",
          100: "#e4defe",
          200: "#c6b9fd",
          300: "#a68efb",
          400: "#8d6ef9",
          500: "#7c5cff",
          600: "#6a45ec",
          700: "#5836c4",
          800: "#472d9c",
          900: "#3a277c",
        },
      },
      borderRadius: {
        sm: "9px",
        DEFAULT: "14px",
        lg: "20px",
        xl: "24px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(16,24,40,0.24)",
        sm: "0 2px 6px rgba(16,24,40,0.28)",
        md: "0 8px 24px rgba(16,24,40,0.36)",
      },
    },
  },
  plugins: [],
};
