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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#c7e0fd',
          300: '#a4c9fc',
          400: '#7eadfa',
          500: '#0A66C2',
          600: '#0552a1',
          700: '#044193',
          800: '#063d81',
          900: '#082d6b',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
  darkMode: 'class',
}
