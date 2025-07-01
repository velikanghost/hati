/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      padding: '24px',
    },
    fontFamily: {
      headings: ['Raleway', 'sans serif'],
      body: ['Poppins', 'sans serif'],
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: '#EBE8E2', //#FFFAF3 F1F9F9 EBE8E2
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#1C4641',
          foreground: '#f0f0f0',
        },
        secondary: {
          DEFAULT: '#FFFFFF',
          foreground: '#1F2026',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-10%)',
          },
          '50%': {
            transform: 'none',
          },
        },
        pulse: {
          '50%': {
            opacity: '.8',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        bounce: 'bounce 0.5s ease-out',
        pulse: 'pulse 1s ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
