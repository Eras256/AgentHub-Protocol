/** @type {import('tailwindcss').Config} */
const config = {
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
      },
      animation: {
        shine: "shine 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        shine: {
          "0%": {
            transform: "translateX(-100%) translateY(-100%) rotate(30deg)",
          },
          "100%": {
            transform: "translateX(100%) translateY(100%) rotate(30deg)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)" },
          "100%": {
            boxShadow:
              "0 0 60px rgba(168, 85, 247, 0.6), 0 0 100px rgba(6, 182, 212, 0.4)",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "neural-pattern": "url('/neural-bg.svg')",
      },
    },
  },
  plugins: [],
};
export default config;

