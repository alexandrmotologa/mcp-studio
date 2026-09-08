/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          950: 'var(--studio-950, #090a0f)',
          900: 'var(--studio-900, #0f111a)',
          850: 'var(--studio-850, #151824)',
          800: 'var(--studio-800, #1c2030)',
          700: 'var(--studio-700, #282e45)',
          600: 'var(--studio-600, #3c4466)',
          border: 'var(--studio-border, #23293d)',
          accent: 'var(--studio-accent, #6366f1)',
          accentHover: '#4f46e5',
          cyan: '#06b6d4',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    }
  },
  plugins: []
}
