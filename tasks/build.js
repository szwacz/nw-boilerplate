'use strict';

var gulp = require('gulp');
var less = require('gulp-less');
var esperanto = require('esperanto');
var map = require('vinyl-map');
var projectDir = require('fs-jetpack');

var utils = require('./utils');

// -------------------------------------
// Setup
// -------------------------------------

var srcDir = projectDir.cwd('./app/');
var destDir = projectDir.cwd('./build/');

// On Windows and Linux our code is going into main directory...
var destForCodeDir = destDir;
if (utils.os() === 'osx') {
    // ...but on OSX deep into folder in bundle structure.
    destForCodeDir = destDir.cwd('./nwjs.app/Contents/Resources/app.nw');
}

var paths = {
    jsCode: [
        'app/**/*.js',
        '!app/node_modules/**',
        '!app/bower_components/**',
        '!app/vendor/**'
    ]
}

// -------------------------------------
// Tasks
// -------------------------------------

gulp.task('clean', function(callback) {
    return destDir.dirAsync('.', { empty: true });
});


gulp.task('prepare-runtime', ['clean'] , function () {
    var runtimeForThisOs = './nw/' + utils.os();
    return projectDir.copyAsync(runtimeForThisOs, destDir.path(), {
        overwrite: true
    });
});


var copyTask = function () {
    return projectDir.copyAsync('app', destForCodeDir.path(), {
        overwrite: true,
        matching: [
            './node_modules/**',
            './vendor/**',
            '*.html'
        ]
    });
};
gulp.task('copy', ['prepare-runtime'], copyTask);
gulp.task('copy-watch', copyTask);


var transpileTask = function () {
    return gulp.src(paths.jsCode)
    .pipe(map(function(code, filename) {
        var transpiled = esperanto.toAmd(code.toString(), { strict: true });
        return transpiled.code;
    }))
    .pipe(gulp.dest(destForCodeDir.path()));
};
gulp.task('transpile', ['prepare-runtime'], transpileTask);
gulp.task('transpile-watch', transpileTask);


var lessTask = function () {
    return gulp.src('app/stylesheets/main.less')
    .pipe(less())
    .pipe(gulp.dest(destForCodeDir.path('stylesheets')));
};
gulp.task('less', ['prepare-runtime'], lessTask);
gulp.task('less-watch', lessTask);


// Add and customize OS-specyfic and target-specyfic stuff.
gulp.task('finalize', ['prepare-runtime'], function () {
    var manifest = srcDir.read('package.json', 'json');
    switch (utils.getBuildTarget()) {
        case 'release':
            // Hide dev toolbar if doing a release.
            manifest.window.toolbar = false;
            break;
        case 'test':
            // Add "-test" suffix to name, so NW.js will write all
            // data like cookies and locaStorage into separate place.
            manifest.name += '-test';
            // Change the main entry to spec runner.
            manifest.main = 'spec.html';
            // Set extra flag so we know this is development mode, and we can
            // alter some behaviours of running app.
            manifest.developmentMode = true;
            break;
        case 'development':
            // Add "-dev" suffix to name, so NW.js will write all
            // data like cookies and locaStorage into separate place.
            manifest.name += '-dev';
            // Set extra flag so we know this is development mode, and we can
            // alter some behaviours of running app.
            manifest.developmentMode = true;
            break;
    }
    destForCodeDir.write('package.json', manifest, { jsonIndent: 4 });

    projectDir.copy('os/icon.png', destForCodeDir.path('icon.png'));

    // Stuff specyfic for certains OS
    switch (utils.os()) {
        case 'windows':
            // icon
            projectDir.copy('os/windows/icon.ico', destDir.path('icon.ico'));
            break;
        case 'osx':
            // Info.plist
            var manifest = projectDir.read('app/package.json', 'json');
            var info = projectDir.read('os/osx/Info.plist');
            info = utils.replace(info, {
                prettyName: manifest.prettyName,
                version: manifest.version
            });
            destDir.write('nwjs.app/Contents/Info.plist', info);
            // icon
            projectDir.copy('os/osx/icon.icns', destDir.path('nwjs.app/Contents/Resources/icon.icns'));
            break;
    }
});


gulp.task('watch', function () {
    gulp.watch(paths.jsCode, ['transpile-watch']);
    gulp.watch('*.less', ['less-watch']);
    gulp.watch('*.html', ['copy-watch']);
});


gulp.task('build', ['transpile', 'less', 'copy', 'finalize']);
