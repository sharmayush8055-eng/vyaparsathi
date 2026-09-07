/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf3",
          100: "#d6fae2",
          200: "#b0f2c9",
          300: "#7ce5aa",
          400: "#42d086",
          500: "#1eb56b",
          600: "#129256",
          700: "#117548",
          800: "#125d3c",
          900: "#104d33",
        },
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
