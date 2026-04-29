/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  safelist: [
    'dark:bg-canvas-dark',
    'dark:bg-card-dark',
    'dark:bg-soft-dark',
    'dark:text-ink-dark',
    'dark:text-body-dark',
    'dark:text-muted-dark',
    'dark:border-hairline-dark'
  ],
  theme: {
    extend: {
      colors: {
        canvas: { DEFAULT: '#faf9f5', dark: '#181715' },
        card: { DEFAULT: '#efe9de', dark: '#252320' },
        soft: { DEFAULT: '#f5f0e8', dark: '#1f1e1b' },
        ink: { DEFAULT: '#141413', dark: '#faf9f5' },
        body: { DEFAULT: '#3d3d3a', dark: '#a09d96' },
        muted: { DEFAULT: '#6c6a64', dark: '#8e8b82' },
        primary: { DEFAULT: '#cc785c', active: '#a9583e' },
        hairline: { DEFAULT: '#e6dfd8', dark: '#3d3d3a' }
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
}
