'use strict';

var gulp = require('gulp');
var less = require('gulp-less');
var through = require('through2');
var transpiler = require('es6-module-transpiler');
var Container = transpiler.Container;
var FileResolver = transpiler.FileResolver;
var AmdFormatter = require('es6-module-transpiler-amd-formatter');
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
    destForCodeDir = destDir.cwd('./node-webkit.app/Contents/Resources/app.nw');
}

// -------------------------------------
// Tasks
// -------------------------------------

gulp.task('clean', function(callback) {
    return destDir.dirAsync('.', { empty: true });
});

gulp.task('prepare-runtime', ['clean'] , function() {
    var runtimeForThisOs = './runtime/' + utils.os();
    return projectDir.copyAsync(runtimeForThisOs, destDir.path(), {
        overwrite: true,
        allBut: [
            'version',
            'nwsnapshot*',
            'credits.html'
        ]
    });
});

gulp.task('copy', ['prepare-runtime'], function() {
    return projectDir.copyAsync('app', destForCodeDir.path(), {
        overwrite: true,
        only: [
            'app/node_modules',
            'app/vendor',
            '*.html'
        ]
    });
});

// Add and customize OS-specyfic and target-specyfic stuff.
gulp.task('finalize', ['prepare-runtime'], function() {
    var manifest = srcDir.read('package.json', 'json');
    switch (utils.getBuildTarget()) {
        case 'release':
            // Hide dev toolbar if doing a release.
            manifest.window.toolbar = false;
            break;
        case 'test':
            // Add "-test" suffix to name, so node-webkit will write all
            // data like cookies and locaStorage into separate place.
            manifest.name += '-test';
            // Change the main entry to spec runner.
            manifest.main = 'spec.html';
            break;
        case 'development':
            // Add "-dev" suffix to name, so node-webkit will write all
            // data like cookies and locaStorage into separate place.
            manifest.name += '-dev';
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
            dest.write('node-webkit.app/Contents/Info.plist', info);
            // icon
            projectDir.copy('os/osx/icon.icns', destDir.path('node-webkit.app/Contents/Resources/icon.icns'));
            break;
    }
});

var transpileTask = function() {
    return gulp.src([
        'app/**/*.js',
        '!app/node_modules/**',
        '!app/vendor/**'
    ], {
        read: false // Don't read the files. ES6 transpiler will do it.
    })
    .pipe(through.obj(function (file, enc, callback) {
        var relPath = file.path.substring(file.base.length);
        var container = new Container({
            resolvers: [new FileResolver([file.base])],
            formatter: new AmdFormatter()
        });
        try {
            container.getModule(relPath);
            container.write(destForCodeDir.path(relPath));
            callback();
        } catch (err) {
            // Show to the user precise file where transpilation error occured.
            callback(relPath + " " + err.message);
        }
    }));
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

gulp.task('watch', function () {
    gulp.watch('app/stylesheets/**', ['less-watch']);
    gulp.watch('app/**/*.js', ['transpile-watch']);
});

gulp.task('build', ['copy', 'finalize', 'transpile', 'less']);
