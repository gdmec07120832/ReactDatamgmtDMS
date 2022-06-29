module.exports = {
    purge: ['./src/pages/**/*.js', './src/components/**/*.js'],
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            width: {
                '21': '5.25rem',
                '18': "4.5rem"
            }
        },
    },
    variants: {
        extend: {
            borderWidth: ['first'],
            margin: ['last']
        },
    },
    plugins: [
        require('@tailwindcss/line-clamp')
    ],
}
