/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#1d4d90",
                "accent-green": "#2E8B57",
                "momo-yellow": "#FFCC00",
                "momo-red": "#E60000",
                "momo-blue": "#0096D6",
                "background-light": "#f6f7f8",
                "background-dark": "#121820",
            },
            fontFamily: {
                "sans": ["Inter", "sans-serif"]
            }
        },
    },
    plugins: [],
}
