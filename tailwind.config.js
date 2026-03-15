/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          blue: '#2563EB',
          lightblue: '#EFF6FF',
          green: '#16A34A',
          lightgreen: '#F0FDF4',
          gray: '#F8FAFC',
        }
      }
    },
  },
  plugins: [],
}
