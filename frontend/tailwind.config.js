/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "login-background": "url('./assets/img/arturrro-x48QL8gNYZ8-unsplash.jpg')"
      }
    },
  },
  plugins: [
    require('tailwindcss-primeui'),
  ],
}

