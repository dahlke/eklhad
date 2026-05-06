const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      maxHeight: {
        "1/4": "25%",
        "1/2": "50%",
        "3/4": "75%",
      },
      inset: {
        "1/10": "10%",
        "1/4": "25%",
      },
      fontFamily: {
        sans: ["Open Sans", ...defaultTheme.fontFamily.sans],
        serif: ["Playfair Display", ...defaultTheme.fontFamily.serif],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        "off-white": "#e8eaf0",
        "chicago-flag-blue": "#58b9f7",
        "chicago-flag-red": "#cc0000",
        "dark-bg": "#0d1117",
        "dark-surface": "#161b22",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        drawLine: {
          "0%":   { transform: "scaleX(0)", opacity: "0" },
          "20%":  { opacity: "1" },
          "70%":  { transform: "scaleX(1)", opacity: "1" },
          "100%": { transform: "scaleX(1)", opacity: "0" },
        },
      },
      animation: {
        "fade-up":   "fadeUp 0.6s ease-out both",
        "draw-line": "drawLine 3.5s ease-in-out 0.75s infinite backwards",
      },
    },
  },
  plugins: [],
};
