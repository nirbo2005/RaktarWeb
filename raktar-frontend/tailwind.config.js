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
        accent: "rgb(var(--accent-primary) / <alpha-value>)",
      },
      backgroundColor: {
        main: "rgb(var(--bg-main) / <alpha-value>)",
        panel: "rgb(var(--bg-panel) / <alpha-value>)",
        input: "rgb(var(--bg-input) / <alpha-value>)",
        hover: "rgb(var(--bg-hover) / <alpha-value>)",
      },
      textColor: {
        main: "rgb(var(--text-main) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        accent: "rgb(var(--accent-primary) / <alpha-value>)",
      },
      borderColor: {
        main: "rgb(var(--border-main) / <alpha-value>)",
        subtle: "rgb(var(--border-subtle) / <alpha-value>)",
        accent: "rgb(var(--accent-primary) / <alpha-value>)",
      },
      ringColor: {
        accent: "rgb(var(--accent-primary) / <alpha-value>)",
      }
    },
  },
  plugins: [],
};