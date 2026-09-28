/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jal-green': '#115E41', // Dark green matching the image
        'jal-bg': '#FAF9F6', // Off-white/beige background
        'jal-text': '#111827', // Almost black for text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Professional sans-serif
      }
    },
  },
  plugins: [],
}
