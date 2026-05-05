/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        walnut: {
          50: "#f7f2ea",
          100: "#ede2d3",
          300: "#d5b08c",
          400: "#ba8758",
          500: "#7a563b",
          700: "#4c3325",
          900: "#221813"
        },
        charcoal: "#1a1a1a",
        parchment: "#f6ecd9",
        copper: {
          400: "#c4834e",
          500: "#a86432",
          600: "#8a4f28"
        },
        amber: {
          warm: "#e8b86d"
        }
      },
      boxShadow: {
        soft: "0 20px 50px rgba(0,0,0,0.25)"
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 18% 18%, rgba(255,230,200,0.35) 0, transparent 38%), radial-gradient(circle at 82% 72%, rgba(232,184,109,0.22) 0, transparent 32%), linear-gradient(135deg, #3d2318 0%, #6b4530 48%, #b07a4a 100%)"
      }
    }
  },
  plugins: []
};
