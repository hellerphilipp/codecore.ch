// Dependencies
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const del = require('del');
const terser = require('gulp-terser');
const replace = require('gulp-replace');
const imagemin = require('gulp-imagemin');
const rename = require('gulp-rename');
const purgecss = require('gulp-purgecss');
const path = require('path');

// Will not remove SVG ViewBox when image optimization process
const imageminOptions = [
	imagemin.svgo({
		plugins: [
			{ removeViewBox: false }
		]
	})
];

// Assign sass compiler
Object.assign(sass, { compiler: require('sass') });

const cleanCSS = require('gulp-clean-css');
const noop = () => require("through2").obj();

let SRC_FOLDER = 'src';

// Clear dist folder for new build
gulp.task('clean', () => {
    return del('dist/**', { force: true });
});

// Gulp task to copy fonts files to output directory
gulp.task('fonts', () => {
    return gulp.src(SRC_FOLDER + '/assets/fonts/**')
        .pipe(gulp.dest('dist/assets/fonts'));
});

// Gulp task to copy css files to output directory
gulp.task('css', () => {
    return gulp.src([
        SRC_FOLDER + '/assets/css/**/*.css',
        SRC_FOLDER + '/assets/js/**/*.css',
    ], { base: SRC_FOLDER })
        .pipe(gulp.dest('dist'));
});

// Gulp task to copy images files to output directory
gulp.task('images', () => {
    return gulp.src(SRC_FOLDER + '/assets/images/**')
        .pipe(imagemin(imageminOptions))
        .pipe(gulp.dest('dist/assets/images'));
});

let usePurgeCSS = false;

/** @param {NodeJS.ReadWriteStream} stream */
const fixHTML = (stream) => {
    return stream
        .pipe(replace(/assets\/scss\/(.*?)\.scss/g, `assets/css/$1.min${usePurgeCSS ? '.purge' : ''}.css`));
};

// Gulp task to copy HTML files to output directory
gulp.task('html', () => {
    return fixHTML(gulp.src([
        SRC_FOLDER + '/**/*.html',
    ], { base: SRC_FOLDER }))
        .pipe(gulp.dest('dist'));
});

// here you can add required css classes manually
const purgeCSSSafeList = [
    'bp-xs', 'bp-sm', 'bp-md', 'bp-lg', 'bp-xl', 'bp-xxl', 'dom-ready', 'page-preload', 'loaded', 'page-revealer', 'darkmode-trigger', 'uc-sticky-placeholder', 'header', 'uc-sticky', 'uc-open', 'uc-active', 'uc-sticky-below', 'uc-sticky-fixed', 'inner', 'nav-desktop', 'wrap', 'sm:hstack', 'xl:btn-xl', 'uc-svg', 'uc-circle-text', 'uc-circle-text-path', 'center-icon', 'uni-testimonials', 'image-hover-revealer',
    '[dir=ltr]', '[dir=rtl]', 'swiper-pagination-clickable', 'swiper-pagination-bullets', 'swiper-pagination-horizontal', 'swiper-pagination-bullet', 'swiper-pagination-bullet-active', 'swiper-slide-fully-visible', 'swiper-watch-progress', 'swiper-initialized', 'swiper-horizontal', 'swiper-slide-visible', 'swiper-slide-prev', 'swiper-slide-next', 'swiper-slide-active', 'uc-accordion', 'uc-switcher', 'uc-grid', 'uc-grid-margin', 'uc-tab', 'uc-tooltip',
];

// Gulp task to concatenate our css files
gulp.task('sass', () => {
    return gulp.src(SRC_FOLDER + '/assets/scss/theme/*.scss')
        .pipe(sass())
        .pipe(cleanCSS({
            level: 0,
            format: 'beautify'
        }))
        .pipe(gulp.dest('dist/assets/css/theme'))
        .pipe(cleanCSS())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest('dist/assets/css/theme'))
        .pipe(!usePurgeCSS ? noop() : purgecss({
            content: ['dist/**/*.html'],
            safelist: purgeCSSSafeList,
            defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        }))
        .pipe(!usePurgeCSS ? noop() : rename({ extname: '.purge.css' }))
        .pipe(!usePurgeCSS ? noop() : gulp.dest('dist/assets/css/theme'));
});
gulp.task('purgecss', () => {
    return gulp.src('dist/assets/css/theme/*.min.css')
        .pipe(purgecss({
            content: ['dist/**/*.html'],
            safelist: purgeCSSSafeList,
            defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        }))
        .pipe(rename({ extname: '.purge.css' }))
        .pipe(gulp.dest('dist/assets/css/theme'));
});

// Gulp task to concatenate our js files
gulp.task('js', () => {
    return gulp.src([
            SRC_FOLDER + '/assets/js/**/*.js',
        ])
        .pipe(terser())
        .pipe(gulp.dest('dist/assets/js'));
});

// Gulp task to copy other files
gulp.task('other', () => {
    return gulp.src([
            SRC_FOLDER + '/**',
            '!' + SRC_FOLDER + '/assets/**',
            '!' + SRC_FOLDER + '/**/*.html',
            '!' + SRC_FOLDER + '/debug*.css',
            '!' + SRC_FOLDER + '/debug*.css.map',
    ], { base: SRC_FOLDER, nodir: true })
        .pipe(gulp.dest('dist'));
});

// Enable Lite version when build
let isLite = false;
gulp.task('enable-lite', async () => {
    isLite = true;
    usePurgeCSS = true;
});

// Gulp build task
gulp.task('build', gulp.series('clean', gulp.parallel(gulp.series(gulp.parallel('css', 'fonts'), 'html', 'sass'), 'images', 'js', 'other')));
gulp.task('build-lite', gulp.series('enable-lite', 'clean', gulp.parallel(gulp.series(gulp.parallel('css', 'fonts'), 'html', 'sass'), 'images', 'js', 'other')));
