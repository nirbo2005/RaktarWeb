// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        main: "rgb(var(--bg-main) / <alpha-value>)",
        panel: "rgb(var(--bg-panel) / <alpha-value>)",
        input: "rgb(var(--bg-input) / <alpha-value>)",
        hover: "rgb(var(--bg-hover) / <alpha-value>)",
        border: {
          main: "rgb(var(--border-main) / <alpha-value>)",
          subtle: "rgb(var(--border-subtle) / <alpha-value>)",
        },
      },
      textColor: {
        main: "rgb(var(--text-main) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};