import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      colors: {
        background: '#0A0C10',
        foreground: '#A1A1AA',
        primary: {
          DEFAULT: '#21808D', // AI Teal
          hover: '#1A6670',
          light: '#2EB0C1',
        },
        stardust: '#F2F2F2', // Headings
        void: '#050608', // Darker background
        surface: 'rgba(255, 255, 255, 0.03)',
        border: 'rgba(255, 255, 255, 0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-cosmic': 'radial-gradient(circle at center, rgba(33, 128, 141, 0.15) 0%, rgba(10, 12, 16, 0) 70%)',
        'gradient-glow': 'conic-gradient(from 180deg at 50% 50%, #21808D 0deg, #0A0C10 180deg, #21808D 360deg)',
      },
      boxShadow: {
        'cosmic': '0 20px 40px -10px rgba(0,0,0,0.5)',
        'glow': '0 0 20px rgba(33, 128, 141, 0.2)',
      },
      animation: {
        'orbit': 'orbit 20s linear infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
