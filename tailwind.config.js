/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        "bg-secondary": "var(--color-bg-secondary)",
        "bg-card": "var(--color-bg-card)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        secondary: "var(--color-secondary)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        holiday: "var(--color-holiday)",
        saturday: "var(--color-saturday)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)"
      },
      fontFamily: {
        sans: ["var(--font-family)"]
      },
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)"
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)"
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)"
      },
      zIndex: {
        base: "0",
        tooltip: "var(--z-tooltip)",
        drawer: "var(--z-drawer)",
        backdrop: "var(--z-backdrop)",
        "modal-1": "var(--z-modal-1)",
        "modal-2": "var(--z-modal-2)",
        "modal-3": "var(--z-modal-3)",
        toast: "var(--z-toast)"
      }
    }
  },
  plugins: []
};
