'use strict';

var argv = require('yargs').argv;
var jetpack = require('fs-jetpack');
var gulp = require('gulp');
var less = require('gulp-less');
var through = require('through2');
var transpiler = require('es6-module-transpiler');
var AmdFormatter = require('es6-module-transpiler-amd-formatter');

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

gulp.task('prepareRuntime', ['clean'] , function() {
    var runtimeForThisOs = './runtime/' + utils.os();
    return jetpack.copyAsync(runtimeForThisOs, dest.path(), {
        overwrite: true,
        allBut: [
            'version',
            'nwsnapshot*',
            'credits.html'
        ]
    });
});

gulp.task('copy', function() {
    return jetpack.copyAsync('app', destForCode.path(), {
        overwrite: true,
        only: [
            'app/node_modules',
            'app/vendor',
            '*.html'
        ]
    });
});

gulp.task('transpile', function() {
    return gulp.src([
        'app/**/*.js',
        '!app/node_modules/**',
        '!app/vendor/**'
    ], {
        read: false // Don't read the files. ES6 transpiler will do it.
    })
    .pipe(through.obj(function (file, enc, callback) {
        var relPath = file.path.substring(file.base.length); // 
        var container = new transpiler.Container({
            resolvers: [new transpiler.FileResolver([file.base])],
            formatter: new AmdFormatter()
        });
        try {
            container.getModule(relPath);
            container.write(destForCode.path(relPath));
            callback();
        } catch (err) {
            callback(relPath + " " + err.message);
        }
    }));
});

gulp.task('less', function () {
    return gulp.src('app/stylesheets/main.less')
    .pipe(less())
    .pipe(gulp.dest(destForCode.path('stylesheets')));
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
            manifest.main = 'spec.html';
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
    gulp.watch('app/**/*.js', ['transpile']);
});

gulp.task('build', ['copy', 'transpile', 'less', 'finalize']);

gulp.task('default', ['prepareRuntime'], function () {
    gulp.run('build');
});
