import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
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
        // Design System Palette from Stitch
        "accent-bright": "#FF9500",
        "accent-blue": "#0A84FF",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "surface-variant": "#e0e3e5",
        "surface-bright": "#f7f9fb",
        "surface-dim": "#d8dadc",
        "surface": "#f7f9fb",
        "surface-slate": "#F8FAFC",
        "deep-navy": "#050B44",
        "prestige-gold": "#D4AF37",
        "alert-red": "#E50000",
        "text-main": "#0F172A",
        "tertiary": "#000000",
        "outline": "#777680",
        "outline-variant": "#c7c5d1",
        "on-surface": "#191c1e",
        "on-surface-variant": "#46464f",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-tertiary": "#ffffff",
        "on-background": "#191c1e",
        "primary-container": "#0e154b",
        "secondary-container": "#fed65b",
        "tertiary-container": "#410000",
        "primary-fixed": "#dfe0ff",
        "primary-fixed-dim": "#bdc2ff",
        "secondary-fixed": "#ffe088",
        "secondary-fixed-dim": "#e9c349",
        "tertiary-fixed": "#ffdad4",
        "tertiary-fixed-dim": "#ffb4a8",
        "on-primary-fixed": "#0e154b",
        "on-primary-fixed-variant": "#3c4279",
        "on-secondary-fixed": "#241a00",
        "on-secondary-fixed-variant": "#574500",
        "on-tertiary-fixed": "#410000",
        "on-tertiary-fixed-variant": "#930100",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
      spacing: {
        "unit": "4px",
        "gutter": "24px",
        "margin-desktop": "80px",
        "margin-mobile": "20px",
        "section-gap": "64px"
      }
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
