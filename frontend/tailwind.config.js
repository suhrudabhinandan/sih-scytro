/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			fontFamily: {
				vierkant: ['var(--font-vierkant)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			animation: {
				'in': 'fadeIn 0.5s ease-in-out',
				'slide-in-from-right': 'slideInFromRight 0.3s ease-out',
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'zoom-in': 'zoomIn 0.2s ease-out',
				'bounce': 'bounce 1s infinite',
				'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
			keyframes: {
				slideInFromRight: {
					'0%': { transform: 'translateX(100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' },
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				zoomIn: {
					'0%': { transform: 'scale(0.9)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
			},
		},
	},
	plugins: [],
}