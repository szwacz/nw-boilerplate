'use strict';

var argv = require('yargs').argv;
var gulp = require('gulp');
var es6ModuleTranspiler = require("gulp-es6-module-transpiler");
var less = require('gulp-less');
var jetpack = require('fs-jetpack');

var utils = require('./scripts/internal/utils');

// Figure out target for this build...
var target = "development";
if (argv.test) {
    target = "test";
} else if (argv.release) {
    target = "release";
}

var src = jetpack.cwd('./app/');
var dest = jetpack.cwd('./build/');
var destForCode;
if (utils.os() === 'osx') {
    destForCode = dest.cwd('./node-webkit.app/Contents/Resources/app.nw');
} else {
    destForCode = dest;
}

gulp.task('clean', function(callback) {
    return dest.dirAsync('.', { empty: true });
});

gulp.task('copy:runtime', ['clean'] , function() {
    var runtimeForThisOs = './runtime/' + utils.os();
    return jetpack.copyAsync(runtimeForThisOs, dest.path(), {
        overwrite: true,
        allBut: ['version', 'nwsnapshot*', 'credits.html']
    });
});

gulp.task('transpile:app', function() {
    return gulp.src(['app/**/*.js', '!app/node_modules/**', '!app/vendor/**', '!app/spec'])
    .pipe(es6ModuleTranspiler({ type: "amd" }))
    .pipe(gulp.dest(destForCode.path()));
});

gulp.task('transpile:spec', function() {
    return gulp.src(['spec/**/*.js', '!spec/runner/**'])
    .pipe(es6ModuleTranspiler({ type: "amd" }))
    .pipe(gulp.dest(destForCode.path()));
});

gulp.task('copy:spec', function() {
    return jetpack.copyAsync('spec', destForCode.path(), { overwrite: true, only: ['spec/runner'] });
});

gulp.task('less', function () {
    return gulp.src('app/stylesheets/**/*.less')
    .pipe(less())
    .pipe(gulp.dest(destForCode.path('stylesheets')));
});

gulp.task('copy:app', function() {
    return jetpack.copyAsync('app', destForCode.path(), { overwrite: true, only: [
        'app/node_modules',
        'app/vendor',
        'app/index.html'
    ] });
});

gulp.task('finalize', function() {
    var manifest = src.read('package.json', 'json');
    switch (target) {
        case 'release':
            // Hide dev toolbar if doing a release.
            manifest.window.toolbar = false;
            break;
        case 'test':
            // Add "-test" suffix to name, so node-webkit will write all
            // data like cookies and locaStorage into separate place.
            manifest.name += '-test';
            // Change the main entry to spec runner.
            manifest.main = 'runner/runner.html';
            break;
        case 'development':
            // Add "-dev" suffix to name, so node-webkit will write all
            // data like cookies and locaStorage into separate place.
            manifest.name += '-dev';
            break;
    }
    destForCode.write('package.json', manifest, { jsonIndent: 4 });
    
    jetpack.copy('os/icon.png', destForCode.path('icon.png'));
    
    // Stuff specyfic for certains OS
    switch (utils.os()) {
        case 'windows':
            // icon
            jetpack.copy('os/windows/icon.ico', dest.path('icon.ico'));
            break;
        case 'osx':
            // Info.plist
            var manifest = jetpack.read('app/package.json', 'json');
            var info = jetpack.read('os/osx/Info.plist');
            info = utils.replace(info, {
                prettyName: manifest.prettyName,
                version: manifest.version
            });
            dest.write('node-webkit.app/Contents/Info.plist', info);
            // icon
            jetpack.copy('os/osx/icon.icns', dest.path('node-webkit.app/Contents/Resources/icon.icns'));
            break;
    }
});

gulp.task('watch', function () {
    gulp.watch('app/stylesheets/**', ['less']);
    gulp.watch('app/**/*.js', ['transpile:app']);
    gulp.watch('spec/**/*.js', ['transpile:spec']);
});

gulp.task('build:app', ['transpile:app', 'copy:app', 'less', 'finalize']);
gulp.task('build:spec', ['transpile:spec', 'copy:spec']);

gulp.task('default', ['clean', 'copy:runtime'], function () {
    if (target === 'release') {
        gulp.run(['build:app']); // Exclude specs from release build
    } else {
        gulp.run(['build:spec', 'build:app']);
    }
});
