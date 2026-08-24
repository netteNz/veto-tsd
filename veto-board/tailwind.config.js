/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // Source of truth is the @theme block in src/index.css (Tailwind v4
      // CSS-first config). Mirrored here for editor tooling only.
      colors: {
        void: '#0B0E14',
        panel: '#12161F',
        panelRaised: '#1A2030',
        hud: '#4FD8E8',
        teamRed: '#E23744',
        teamBlue: '#3B6FE0',
        warn: '#F5A623',
        ink: {
          DEFAULT: '#E7ECF2',
          muted: '#6C7889',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'system-ui', 'sans-serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
}