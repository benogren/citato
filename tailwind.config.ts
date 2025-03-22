import type { Config } from "tailwindcss";
const flowbite = require("flowbite-react/tailwind");

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "node_modules/flowbite-react/**/*.js",
    flowbite.content(),
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        purple: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // 'air_force_blue': { DEFAULT: '#5d8aa8', 100: '#121c22', 200: '#243744', 300: '#375365', 400: '#496e87', 500: '#5d8aa8', 600: '#7da1b9', 700: '#9eb9cb', 800: '#bed0dc', 900: '#dfe8ee' }, 
        // 'gunmetal': { DEFAULT: '#253031', 100: '#070a0a', 200: '#0f1314', 300: '#161d1e', 400: '#1e2728', 500: '#253031', 600: '#4a6062', 700: '#6e8f92', 800: '#9eb4b6', 900: '#cfdadb' }, 
        // 'mint_cream': { DEFAULT: '#f1f7ed', 100: '#2d431e', 200: '#5a863c', 300: '#89bb68', 400: '#bdd9ab', 500: '#f1f7ed', 600: '#f4f9f1', 700: '#f7faf4', 800: '#fafcf8', 900: '#fcfdfb' }, 
        // 'rose_red': { DEFAULT: '#b33951', 100: '#240b10', 200: '#471720', 300: '#6b2230', 400: '#8f2d41', 500: '#b33951', 600: '#ca586e', 700: '#d78193', 800: '#e5abb7', 900: '#f2d5db' }, 
        // 'flax': { DEFAULT: '#e3d081', 100: '#3b310d', 200: '#75631a', 300: '#b09427', 400: '#d7ba47', 500: '#e3d081', 600: '#e9d99b', 700: '#eee3b4', 800: '#f4eccd', 900: '#f9f6e6' }
      },
    },
  },
  plugins: [
    flowbite.plugin(),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
} satisfies Config;
