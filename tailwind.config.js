/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tokens de Diseño Premium
        brand: {
          yellow: "#FFB100",
          orange: "#FF6B00",
          hover: "#E6A000",
        },
        bg: {
          primary: "#000000",
          surface: "#0A0A0A",
          elevated: "#121212",
          border: "#1F1F1F", // Definido aquí para que border-bg-border funcione
        },
        state: {
          success: "#10B981",
          error: "#EF4444",
          warning: "#F59E0B",
          info: "#3B82F6",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        '2xl': "1.5rem",
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 255, 0, 0.15)',
        'glow-orange': '0 0 20px rgba(255, 107, 0, 0.15)',
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "slide-in": {
          from: { transform: "translateY(10px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        }
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
