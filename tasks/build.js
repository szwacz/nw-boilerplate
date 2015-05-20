'use strict';

var gulp = require('gulp');
var less = require('gulp-less');
var esperanto = require('esperanto');
var map = require('vinyl-map');
var jetpack = require('fs-jetpack');

var utils = require('./utils');

var projectDir = jetpack;
var srcDir = projectDir.cwd('./app');
var destDir = projectDir.cwd('./build');

var paths = {
    jsCodeToTranspile: [
        'app/**/*.js',
        '!app/node_modules/**',
        '!app/bower_components/**',
        '!app/vendor/**'
    ],
    toCopy: [
        'app/node_modules/**',
        'app/bower_components/**',
        'app/vendor/**',
        '*.html'
    ],
}

// -------------------------------------
// Tasks
// -------------------------------------

gulp.task('clean', function(callback) {
    return destDir.dirAsync('.', { empty: true });
});


var copyTask = function () {
    projectDir.copy('resources/icon.png', destDir.path('icon.png'), { overwrite: true });

    return projectDir.copyAsync('app', destDir.path(), {
        overwrite: true,
        matching: paths.toCopy
    });
};
gulp.task('copy', ['clean'], copyTask);
gulp.task('copy-watch', copyTask);


var transpileTask = function () {
    return gulp.src(paths.jsCodeToTranspile)
    .pipe(map(function(code, filename) {
        var transpiled = esperanto.toAmd(code.toString(), { strict: true });
        return transpiled.code;
    }))
    .pipe(gulp.dest(destDir.path()));
};
gulp.task('transpile', ['clean'], transpileTask);
gulp.task('transpile-watch', transpileTask);


var lessTask = function () {
    return gulp.src('app/stylesheets/*.less')
    .pipe(less())
    .pipe(gulp.dest(destDir.path('stylesheets')));
};
gulp.task('less', ['clean'], lessTask);
gulp.task('less-watch', lessTask);


// Add and customize OS-specyfic and target-specyfic stuff.
gulp.task('finalize', ['clean'], function () {
    var manifest = srcDir.read('package.json', 'json');
    switch (utils.getEnvName()) {
        case 'production':
            // Hide dev toolbar if doing a release.
            manifest.window.toolbar = false;
            break;
        case 'test':
            // Add "-test" suffix to name, so NW.js will write all
            // data like cookies and locaStorage into separate place.
            manifest.name += '-test';
            // Change the main entry to spec runner.
            manifest.main = 'spec.html';
            break;
        case 'development':
            // Add "-dev" suffix to name, so NW.js will write all
            // data like cookies and locaStorage into separate place.
            manifest.name += '-dev';
            break;
    }
    destDir.write('package.json', manifest);

    var configFilePath = projectDir.path('config/env_' + utils.getEnvName() + '.json');
    destDir.copy(configFilePath, 'env_config.json');
});


gulp.task('watch', function () {
    gulp.watch(paths.jsCodeToTranspile, ['transpile-watch']);
    gulp.watch(paths.toCopy, ['copy-watch']);
    gulp.watch('*.less', ['less-watch']);
});


gulp.task('build', ['transpile', 'less', 'copy', 'finalize']);
