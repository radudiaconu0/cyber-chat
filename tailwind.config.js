/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'neon-green': '#39ff14',
        'neon-blue': '#00d4ff',
        'neon-purple': '#bf00ff',
        'neon-pink': '#ff073a',
        'neon-yellow': '#ffff00',
        'cyber-dark': '#0a0a0a',
        'cyber-darker': '#050505',
        'dark': {
          100: '#1a1a1a',
          200: '#2a2a2a',
          300: '#3a3a3a',
          400: '#4a4a4a',
          500: '#5a5a5a',
          600: '#6a6a6a',
          700: '#7a7a7a',
          800: '#8a8a8a',
          900: '#9a9a9a'
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'display': ['Orbitron', 'sans-serif']
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-neon': 'pulse-neon 1.5s ease-in-out infinite',
        'scan': 'scan 8s linear infinite',
        'glitch': 'glitch 2s linear infinite',
        'matrix': 'matrix 20s linear infinite',
        'fadeIn': 'fadeIn 0.5s ease-out',
        'slideInLeft': 'slideInLeft 0.3s ease-out',
        'slideInRight': 'slideInRight 0.3s ease-out',
        'slideInUp': 'slideInUp 0.3s ease-out',
        'typewriter': 'typewriter 2s steps(40, end)',
        'blink': 'blink 1s infinite'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(57, 255, 20, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(57, 255, 20, 0.8), 0 0 40px rgba(57, 255, 20, 0.4)' }
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        glitch: {
          '0%, 14%, 15%, 49%, 50%, 99%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '2%': { transform: 'translate3d(-2px, 0, 0)' },
          '62%': { transform: 'translate3d(2px, 0, 0)' }
        },
        matrix: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' }
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' }
        }
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(rgba(57, 255, 20, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 255, 20, 0.1) 1px, transparent 1px)',
        'neon-gradient': 'linear-gradient(45deg, #39ff14, #00d4ff, #bf00ff)',
        'dark-gradient': 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
        'hologram': 'linear-gradient(45deg, rgba(57, 255, 20, 0.1), rgba(0, 212, 255, 0.1), rgba(191, 0, 255, 0.1))'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}