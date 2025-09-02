/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#343541',
        panelBg: '#202123',
        mainBg: '#13131A',
        accent: '#10A37F',
        // use 'ink' as the color family to avoid dot notation
        ink: {
          light: '#ECECF1',
          muted: '#8E8EA0',
        },
      },
      fontFamily: {
        // Changed from Inter to Lato
        sans: ['Lato', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
}