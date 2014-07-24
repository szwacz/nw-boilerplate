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
var destForCode;
if (utils.os() === 'osx') {
    destForCode = jetpack.cwd('./build/node-webkit.app/Contents/Resources/app.nw');
} else {
    destForCode = dest;
}


gulp.task('clean', function(callback) {
    dest.dirAsync('.', { empty: true })
    .then(function () {
        callback();
    });
});

gulp.task('copyRuntime', ['clean'] , function(callback) {
    var runtimeForThisOs = './runtime/' + utils.os();
    jetpack.copyAsync(runtimeForThisOs, dest.path(), { overwrite: true, allBut: ['version', 'nwsnapshot*', 'credits.html'] })
    .then(function () {
        if (utils.os() === 'osx') {
            var manifest = jetpack.read('app/package.json', 'json')
            var info = jetpack.read('os/osx/Info.plist')
            info = utils.replace(info, {
                name: manifest.prettyName,
                version: manifest.version
            })
            dest.write('node-webkit.app/Contents/Info.plist', info)
            jetpack.copy('os/osx/icon.icns', dest.path('node-webkit.app/Contents/Resources/icon.icns'));
        }
        callback();
    });
});

gulp.task('browserify', ['clean', 'copyRuntime'], function() {
    browserify(src.path('app.js'))
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(destForCode.path()));
});

gulp.task('less', ['clean', 'copyRuntime'], function () {
    gulp.src(src.cwd() + '/stylesheets/**/*.less')
    .pipe(less())
    .pipe(gulp.dest(destForCode.path('stylesheets')));
});

gulp.task('copy', ['clean', 'copyRuntime'] , function(callback) {
    src.copyAsync('node_modules', destForCode.path('node_modules'))
    .then(function () {
        return src.copyAsync('index.html', destForCode.path('index.html'));
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
        return destForCode.writeAsync('package.json', manifest, { jsonIndent: 4 });
    })
    .then(function () {
        return jetpack.copyAsync('./os/icon.png', destForCode.path('icon.png'));
    })
    .then(callback);
});

gulp.task('build', ['clean', 'copyRuntime', 'browserify', 'less', 'copy']);
