/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./imports/ui/**/*.{js,jsx,ts,tsx}', './client/*.html'],
	theme: {
		extend: {},
	},
	plugins: [require('daisyui')],
	daisyui: {
		styled: true,
		themes: true,
		base: true,
		utils: true,
		logs: true,
		rtl: false,
		prefix: '',
		darkTheme: 'dark',
	},
};
