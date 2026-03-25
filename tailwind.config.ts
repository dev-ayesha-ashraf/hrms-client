import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#08e9c7",
        secondary: "#031d51",
        accent: "#a3f7ef",
        neutral: "#637991",
        background: "#feffff",
      },
    },
  },
  plugins: [],
};

export default config;