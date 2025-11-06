import { purgeCSSPlugin } from "@fullhuman/postcss-purgecss";

export default {
    plugins: [
        purgeCSSPlugin({
            content: ['index.html', '**/*.js'],
            css: 'scss/styles.scss',
            keyframes: true,
            fontFace: true,
            variables: true
        })
    ]
};
