/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        cream: "#f8fafc",
        brand: "#4f46e5",
        "brand-light": "#eef2ff",
        "brand-dark": "#3730a3",
        muted: "#64748b",
        border: "#e2e8f0",
        surface: "#ffffff",
        "surface-2": "#f8fafc",
        "surface-3": "#f1f5f9",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
        "card-gradient": "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        "brand-gradient": "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(15, 23, 42, 0.06)",
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 8px 30px rgba(15, 23, 42, 0.10)",
        "button-brand": "0 4px 14px rgba(79, 70, 229, 0.3)",
        "ring-brand": "0 0 0 3px rgba(79, 70, 229, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
        "shimmer": "shimmer 1.8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
