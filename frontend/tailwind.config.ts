import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        background: '#F8F9FA',
        surface:    '#FFFFFF',
        surfaceAlt: '#F1F3F4',
        border:     '#DADCE0',
        borderSoft: '#E8EAED',
        foreground: '#202124',
        muted:      '#5F6368',
        faint:      '#80868B',

        accent:      '#1A73E8',
        accentSoft:  '#E8F0FE',
        accentHover: '#1557B0',

        success:     '#137333',
        successSoft: '#E6F4EA',
        danger:      '#C5221F',
        dangerSoft:  '#FCE8E6',
        warning:     '#B06000',
        warningSoft: '#FEF7E0',

        primary: {
          50:  '#E8F0FE',
          100: '#D2E3FC',
          200: '#AECBFA',
          300: '#74A7F5',
          400: '#4285F4',
          500: '#1A73E8',
          600: '#1557B0',
          700: '#0D47A1',
          800: '#0B3065',
          900: '#072348',
        },
      },

      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },

      borderRadius: {
        sm:    '6px',
        DEFAULT: '8px',
        md:    '8px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '24px',
        full:  '9999px',
      },

      boxShadow: {
        xs:       '0 1px 2px rgba(60,64,67,0.15)',
        sm:       '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        card:     '0 1px 2px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.1)',
        dropdown: '0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        modal:    '0 8px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(60,64,67,0.22), 0 8px 20px rgba(60,64,67,0.1)',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },

      animation: {
        'fade-in':   'fadeIn 0.2s ease-out both',
        'slide-up':  'slideUp 0.25s cubic-bezier(0,0,0.2,1) both',
        'scale-in':  'scaleIn 0.15s cubic-bezier(0,0,0.2,1) both',
        'pulse-soft':'pulseSoft 2s ease-in-out infinite',
      },

      transitionTimingFunction: {
        google: 'cubic-bezier(0.4, 0, 0.2, 1)',
        decel:  'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
