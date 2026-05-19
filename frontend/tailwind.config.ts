import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        global: "var(--radius)",
      },
      boxShadow: {
        brutal: "var(--shadow-brutal)",
      },
    },
  },
  plugins: [],
};

export default config;
