var gulp = require('gulp');
var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-clean-css');
var replace = require('gulp-replace');
var del = require('del');
var exec = require('gulp-exec')
var cp = require('child_process');

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

function firebaseDeploy(cb) {
    return cp.execFile('firebase deploy');
}

exports.build = gulp.series(
    clean,
    gulp.parallel(
        html,
        root,
        js,
        css
    )
);
exports.deploy = gulp.series(
    exports.build,
    firebaseDeploy
)