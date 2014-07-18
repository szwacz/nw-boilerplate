var argv = require('yargs').argv;
var gulp = require('gulp');
var less = require('gulp-less');
var browserify = require('browserify');
var jetpack = require('fs-jetpack');
var source = require('vinyl-source-stream');

var utils = require('./scripts/internal/utils');

// Could be "development" or "release"
var terget = argv.target || "development"

var src = jetpack.cwd('./app/');
var dest = jetpack.cwd('./build/');

gulp.task('clean', function(callback) {
    dest.dirAsync('.', { empty: true })
    .then(function () {
        callback();
    });
});

gulp.task('browserify', ['clean'], function() {
    browserify(src.path('app.js'))
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(dest.cwd()));
});

gulp.task('less', ['clean'], function () {
    gulp.src(src.cwd() + '/stylesheets/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('./build/stylesheets'));
});

gulp.task('copy', ['clean'] , function(callback) {
    src.copyAsync('node_modules', dest.path('node_modules'))
    .then(function () {
        return src.copyAsync('index.html', dest.path('index.html'));
    })
    .then(function () {
        return src.readAsync('package.json', 'json');
    })
    .then(function (manifest) {
        if (terget === 'release') {
            // Hide dev toolbar if doing a release.
            manifest.window.toolbar = false;
        } else {
            // Show dev toolbar in development mode.
            manifest.window.toolbar = true;
            // Add "-dev" suffix to name, so the app will write all the
            // node-webkit data into different directory than released
            // app (so you can have both on the same machine not
            // interacting with each other).
            manifest.name += '-dev';
        }
        return dest.writeAsync('package.json', manifest);
    })
    .then(function () {
        return jetpack.copyAsync('./os/icon.png', dest.path('icon.png'));
    })
    .then(callback);
});

gulp.task('copyRuntime', ['clean'] , function(callback) {
    var runtimeForThisOs = './runtime/' + utils.os();
    jetpack.copyAsync(runtimeForThisOs, dest.path(), { overwrite: true, allBut: ['version', 'nwsnapshot*', 'credits.html'] })
    .then(function () {
        callback();
    });
});

gulp.task('build', ['clean', 'browserify', 'less', 'copy', 'copyRuntime']);