import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'uvz-blue': '#1e3a8a',
        'uvz-orange': '#f97316',
        'uvz-cream': '#fef7ed',
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #000000',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
