import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#172033", brand: "#3157d5", mint: "#18a999" }, boxShadow: { soft: "0 12px 40px rgba(20,35,75,.08)" } } },
  plugins: []
};
export default config;
