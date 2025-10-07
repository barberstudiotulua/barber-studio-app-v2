/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['"Playfair Display"', 'serif'],
        'sans': ['"Roboto"', 'sans-serif'],
      },
      colors: {
        // Renombrado de 'gold' a 'brand-gold' para consistencia
        'brand-gold': '#D4AF37', 
        
        // Dark Mode Colors
        'dark-primary': '#121212',
        'dark-secondary': '#1E1E1E',
        'text-light': '#EAEAEA',
        'text-medium': '#A0A0A0',

        // Light Mode Colors
        'light-primary': '#F7F7F7',
        'light-secondary': '#FFFFFF',
        'text-dark': '#18181B',
        'text-soft': '#52525B',
      }
    },
  },
  plugins: [],
}