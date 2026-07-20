import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Rose Magenta — couleur principale (logo "Menu")
          pink:        '#E91E8C',
          'pink-dark': '#C4166F',
          'pink-light':'#FCE4F3',

          // Cyan — couleur secondaire (CMYK)
          cyan:        '#00B4D8',
          'cyan-dark': '#0096B7',
          'cyan-light':'#E0F7FC',

          // Jaune — accent (CMYK)
          yellow:      '#F7C948',
          'yellow-light': '#FFFBEB',

          // Bleu marine — sidebar, headers
          navy:        '#1A1A6E',
          'navy-light':'#2D2D8E',
          'navy-pale': '#EEF0FB',

          // Neutres
          bg:          '#F8FAFB',
          surface:     '#FFFFFF',
          border:      '#E5E7EB',
          muted:       '#6B7280',
          dark:        '#111827',
        }
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        'card':  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(233,30,140,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        'pink':  '0 4px 14px rgba(233,30,140,0.25)',
      },
      borderRadius: {
        'card': '12px',
        'btn':  '8px',
      }
    }
  },
  plugins: [],
};

export default config;
