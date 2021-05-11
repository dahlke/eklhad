// craco.config.js
module.exports = {
    style: {
        postcss: {
            plugins: [
                require("tailwindcss"),
                require("postcss-nested"),
                require("autoprefixer"),
            ],
        },
    },
}