/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6D28D9', // Violeta que representa el ambiente musical
          50: '#EDE9F6',
          100: '#D4C8EC',
          200: '#B9A6E3',
          300: '#9F85DA',
          400: '#8463D1',
          500: '#6D28D9',
          600: '#5521AE',
          700: '#401A82',
          800: '#2B1257',
          900: '#15092B',
        },
        secondary: {
          DEFAULT: '#F59E0B', // Ámbar energético para el ambiente festivo
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
