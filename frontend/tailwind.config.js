/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kong: {
          50: '#f0f5ff',
          100: '#e0ecff',
          500: '#1155cb',
          600: '#0044b4',
          700: '#003399',
          900: '#001a4d'
        }
      }
    },
  },
  plugins: [],
}
