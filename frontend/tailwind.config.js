/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'Manrope',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        'raah-bg':        '#F8F7F5',
        'raah-bg-alt':    '#F1F0ED',
        'raah-surface':   '#EDEDEA',
        'raah-border':    '#E2E1DE',
        'raah-muted':     '#8A8880',
        'raah-body':      '#3D3C3A',
        'raah-heading':   '#1A1917',
        'raah-dark':      '#111110',
        'raah-dark-alt':  '#1C1B19',
        'raah-accent':    '#C17A3A',
        'raah-accent-l':  '#D4904E',
        'raah-safe':      '#3D7A5C',
        'raah-warn':      '#B8843A',
        'raah-danger':    '#A0402D',
        'raah-info':      '#3A6090',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(.16,1,.3,1)',
        'smooth': 'cubic-bezier(.4,0,.2,1)',
      },
    },
  },
  plugins: [],
}
