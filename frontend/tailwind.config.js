/** @type {import('tailwindcss').Config} */
module.exports = {
    // `overline` is a Tailwind utility; without this an app's own eyebrow-label class draws a line above the text.
    blocklist: ["overline"],
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        oat: {
          50: '#FDFBF7',
          100: '#FAF8F4',
          200: '#F2EDE4',
          300: '#E6E0D5',
          400: '#D5CDBF',
          DEFAULT: '#FAF8F4',
        },
        pista: {
          50: '#F5FAF3',
          100: '#EAF4E8',
          200: '#D7ECD2',
          300: '#C5E1A5',
          400: '#A4CB82',
          DEFAULT: '#C5E1A5',
          dark: '#2E5524',
        },
        lilac: {
          50: '#FAF7FD',
          100: '#F2EBFA',
          200: '#E4D6F6',
          300: '#D5C0F0',
          400: '#BEA0E5',
          DEFAULT: '#D8C7F5',
          dark: '#4B2A7E',
        },
        spunsugar: {
          50: '#F3FAFC',
          100: '#E6F5F9',
          200: '#CEEEF4',
          300: '#BCE3EB',
          400: '#9AD6E3',
          DEFAULT: '#BCE3EB',
          dark: '#1C5465',
        },
        palepurple: {
          50: '#F9F6FD',
          100: '#F2ECFA',
          200: '#E4D6F6',
          300: '#D6C0F1',
          400: '#BF9EE6',
          DEFAULT: '#DDD0F7',
          dark: '#513279',
        },
        duskysky: {
          50: '#F3F6FA',
          100: '#E6EEF6',
          200: '#D0DFEE',
          300: '#B5CCE2',
          400: '#9EB8D9',
          DEFAULT: '#9EB8D9',
          dark: '#2B486E',
        }
      },

      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};