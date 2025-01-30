/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      //colors used in the project
      colors: {
        primary: '#2B85ff',
        secondary: '#Ef863E',
        
    },
    container: {
      center: true,
      padding: '1rem', 
    },
  },
  plugins: [],
}

}