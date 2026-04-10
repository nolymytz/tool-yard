/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Rugged / jobsite palette
        steel: {
          50:  '#f5f6f7',
          100: '#e4e6e9',
          200: '#c6cbd1',
          300: '#9ea5ae',
          400: '#6b7480',
          500: '#4a525c',
          600: '#363c44',
          700: '#272c33',
          800: '#181c21',
          900: '#0d1014',
          950: '#07090b'
        },
        safety: {
          // Safety orange
          DEFAULT: '#FF6B1A',
          50:  '#fff4ec',
          100: '#ffe5d1',
          200: '#ffc49a',
          300: '#ff9a5c',
          400: '#ff7a2e',
          500: '#FF6B1A',
          600: '#e64d00',
          700: '#b23b00',
          800: '#7a2900',
          900: '#421600'
        },
        caution: {
          // Hazard yellow
          DEFAULT: '#FACC15',
          400: '#FDE047',
          500: '#FACC15',
          600: '#CA9A04'
        }
      },
      fontFamily: {
        stencil: ['"Oswald"', '"Impact"', 'system-ui', 'sans-serif'],
        display: ['"Oswald"', '"Impact"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'hard': '4px 4px 0 0 #0d1014',
        'hard-safety': '4px 4px 0 0 #FF6B1A',
      },
      backgroundImage: {
        'hazard-stripe':
          'repeating-linear-gradient(45deg, #FACC15 0 14px, #0d1014 14px 28px)',
        'safety-stripe':
          'repeating-linear-gradient(45deg, #FF6B1A 0 14px, #0d1014 14px 28px)',
        'grid-steel':
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)'
      }
    }
  },
  plugins: []
}
