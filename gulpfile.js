var gulp = require('gulp');

var del = require('del');
var gulpif = require('gulp-if');
var eslint = require ('gulp-eslint');
var minifyCss = require('gulp-clean-css');
var replace = require('gulp-replace');
var shell = require('gulp-shell')
var uglify = require('gulp-uglify');
var useref = require('gulp-useref');

function clean(cb) {
    return del('build');
}

function html(cb) {
    return gulp.src('public/**/*.html')
        .pipe(replace(/http:\/\/localhost:5001/g, 'https://tonkasourceworkflows.firebaseapp.com'))
        .pipe(replace(/http:\/\/localhost:5000\/alison-krause\/us-central1/g, 'https://us-central1-alison-krause.cloudfunctions.net'))
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest('build/Release'));
}

function lint(cb) {
    return gulp.src('public/**/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

function js(cb) {
    return gulp.src('public/**/*.js')
        .pipe(replace(/http:\/\/localhost:5001/g, 'https://tonkasourceworkflows.firebaseapp.com'))
        .pipe(replace(/http:\/\/localhost:5000\/alison-krause\/us-central1/g, 'https://us-central1-alison-krause.cloudfunctions.net'))
        .pipe(gulp.dest('build/Release'));
}

function css(cb) {
    return gulp.src('public/**/*.css')
        .pipe(gulp.dest('build/Release'));
}

function root(cb) {
    return gulp.src(['package.json'])
        .pipe(gulp.dest('build/Release'));
}

gulp.task('firebase', shell.task(['firebase deploy']));

exports.build = gulp.series(
    clean,
    gulp.parallel(
        html,
        root,
        gulp.series(lint, js),
        css
    )
);
exports.deploy = gulp.series(
    exports.build,
    shell.task(['firebase deploy'])
)