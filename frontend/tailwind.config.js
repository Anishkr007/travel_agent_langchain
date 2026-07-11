/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#F6EFE1', // Light surface
        },
        indigo: {
          night: '#151B3D',   // Primary dark surface
        },
        brass: {
          DEFAULT: '#C9962C', // Accent
        },
        teal: {
          muted: '#3E7C7C',   // Secondary data
        },
        coral: {
          soft: '#E2725B',    // Alerts/advisories
        }
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'], 
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'], 
      },
      boxShadow: {
        'tag': '0 4px 6px -1px rgba(21, 27, 61, 0.1), 0 2px 4px -1px rgba(21, 27, 61, 0.06)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
