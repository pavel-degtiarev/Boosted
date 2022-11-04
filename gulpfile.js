"use strict";

const { src, dest, parallel, series, watch } = require("gulp");

const browserSync = require("browser-sync").create();
const fileInclude = require("gulp-file-include");
const htmlmin = require("gulp-htmlmin");

const rollup = require("gulp-better-rollup");
const uglify = require("gulp-uglify-es").default;

const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const groupMediaQueries = require("postcss-sort-media-queries");
const csso = require("postcss-csso");

const imagemin = require("gulp-imagemin");
const webp = require('imagemin-webp');

const newer = require("gulp-newer");
const rename = require("gulp-rename");
const filter = require('gulp-filter');
const del = require("del");

// ******  ПУТИ К ПАПКАМ  **********

const source = "src";
const target = "dest";

const sourceHTML = `${source}`;
const sourceSCSS = `${source}/styles`;
const sourceJS = `${source}/js`;
const sourceIMG = `${source}/img/**/*.{jpg,png,svg,webp}`;
const sourceDATA = `${source}/data/**/*.*`;

const destHTML = `${target}/`;
const destCSS = `${target}/css/`;
const destJS = `${target}/js/`;
const destIMG = `${target}/img/`;
const destDATA = `${target}/data/`;

// ***** HTML *****

function html() {
    return src(`${sourceHTML}/*.html`, { sourcemaps: true })
        .pipe(fileInclude())
        .pipe(dest(destHTML))
        .pipe(browserSync.stream());
}

function htmlMin() {
    return src(`${sourceHTML}/*.html`)
        .pipe(fileInclude())
        .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
        .pipe(dest(destHTML));
}

// ***** СТИЛИ *****

function styles() {
    return src(`${sourceSCSS}/*.scss`, { sourcemaps: true })
        .pipe(sass({ outputStyle: "expanded" }))
        .pipe(postcss([
            autoprefixer({ cascade: false, grid: "autoplace" }),
            groupMediaQueries()
        ]))
        .pipe(dest(destCSS, { sourcemaps: "." }))
        .pipe(browserSync.stream());
}

function stylesMin() {
    return src(`${sourceSCSS}/*.scss`)
        .pipe(sass())
        .pipe(postcss([
            autoprefixer({ cascade: false, grid: "autoplace" }),
            groupMediaQueries(),
            csso()
        ]))
        .pipe(dest(destCSS));
}

// ***** СКРИПТЫ *****

function scripts() {
    return src(`${sourceJS}/*.js`, { sourcemaps: true })
        .pipe(rollup("es")) // как вариант - iife
        .pipe(dest(destJS, { sourcemaps: "." }))
        .pipe(browserSync.stream());
}

function scriptsMin() {
    return src(`${sourceJS}/*.js`)
        .pipe(rollup("es"))
        .pipe(uglify())
        .pipe(dest(destJS));
}

// ***** КАРТИНКИ *****

function images() {
    return src(sourceIMG)
        .pipe(newer(destIMG))
        .pipe(dest(destIMG))
        .pipe(filter(`${destIMG}/**/*.jpg`))
        .pipe(imagemin([
            webp({ quality: 75 })
        ]))
        .pipe(rename(
            { extname: ".webp" }
        ))
        .pipe(dest(destIMG))
        .pipe(browserSync.stream());
}

function imagesMin() {
    return src(sourceIMG)
        .pipe(
            imagemin([
                imagemin.mozjpeg({ quality: 75, progressive: true }),
                imagemin.optipng({ optimizationLevel: 3 }),
                imagemin.svgo({
                    plugins: [
                        { removeViewBox: false },
                        { removeUselessStrokeAndFill: false },
                        { cleanupIDs: false }],
                }),
            ])
        )
        .pipe(dest(destIMG))
        .pipe(filter(`${destIMG}/**/*.jpg`))
        .pipe(imagemin([
            webp({ quality: 75 })
        ]))
        .pipe(rename(
            { extname: ".webp" }
        ))
        .pipe(dest(destIMG));
}

// ***** ШРИФТЫ *****

// function fonts() {
//     return src(sourceFONTS)
//        .pipe(newer(destFONTS))
//        .pipe(dest(destFONTS));
//  }

// ***** ДРУГИЕ ФАЙЛЫ *****

function other() {
    return src(sourceDATA)
        .pipe(newer(destDATA))
        .pipe(dest(destDATA));
}

// *********  СЛУЖЕБНЫЕ  ***************

function startServer() {
    browserSync.init({
        server: { baseDir: `./${target}/` },
        browser: "google chrome",
        cors: true,
        ui: false,
        notify: false,
        ghostMode: false,
    });
}

function watchProject() {
    watch(`${source}/**/*.html`, html);
    watch(`${source}/**/*.scss`, styles);
    watch(`${source}/**/*.js`, scripts);
    watch(sourceIMG, images);
}

function clean() {
    return del(target, { force: true });
}

// *****************************

exports.build = series(
    clean, parallel(htmlMin, stylesMin, scriptsMin, imagesMin, other), parallel(startServer, watchProject));

exports.default = series(
    parallel(html, styles, scripts, images, other), parallel(startServer, watchProject));
