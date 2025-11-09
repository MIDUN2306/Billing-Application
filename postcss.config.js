export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      flexbox: 'no-2009',
      grid: 'autoplace',
      overrideBrowserslist: [
        '> 0.5%',
        'last 2 versions',
        'Firefox ESR',
        'not dead',
        'Android >= 10',
        'Chrome >= 61',
        'Safari >= 11',
        'iOS >= 11'
      ]
    },
  },
}
