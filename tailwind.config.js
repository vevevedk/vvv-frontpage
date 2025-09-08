/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#004658',
          dark: '#003a4a',
          light: '#005a6b'
        },
        secondary: '#ff9101',
        accent: '#ff9101',
        text: '#252525',
        background: '#f2f2f2',
        'dark-grey': '#2A2A2A',
        gray: {
          light: '#e6e6e6',
          DEFAULT: '#f0f0f0'
        }
      },
      maxWidth: {
        wrapper: '1200px'
      },
      borderRadius: {
        'custom': '16px'
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}

