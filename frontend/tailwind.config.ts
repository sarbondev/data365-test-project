import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1200px' },
    },
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#F7F7F7',
        border: '#E0E0E0',
        borderSoft: '#EEEEEE',
        foreground: '#212121',
        muted: '#757575',
        faint: '#9E9E9E',
        accent: '#1976D2',
        accentSoft: '#E3F2FD',
        success: '#2E7D32',
        danger: '#C62828',
        warning: '#ED6C02',
      },
      fontFamily: {
        sans: [
          'Roboto',
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
        sm: '4px',
        DEFAULT: '4px',
        md: '4px',
        lg: '8px',
        xl: '8px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
