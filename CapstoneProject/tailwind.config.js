/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          900: '#16113a',
          950: '#0d0a24',
        },
        duel: {
          purple: '#6d28d9',
          violet: '#7c3aed',
          amber: '#f59e0b',
          coral: '#f43f5e',
          emerald: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
