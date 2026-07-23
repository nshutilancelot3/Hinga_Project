import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        hinga: {
          green: "#1F6B3A",
          greenDark: "#154D29",
          terracotta: "#C1622B",
          cream: "#FBF6EC",
          ink: "#2B2118",
          inkMuted: "#5C4A3B",
        },
      },
    },
  },
  plugins: [],
};
export default config;
