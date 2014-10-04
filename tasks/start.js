'use strict';

var gulp = require('gulp');
var childProcess = require('child_process');
var utils = require('./utils');

// Starts the app in /build folder and runs gulp watch for the time, when app is running.
gulp.task('start', ['watch', 'build'], function () {
    var app;
    
    switch (utils.os()) {
        case 'osx':
            app = childProcess.spawn('open', ['./build/node-webkit.app', "-W"]);
            break;
        case 'linux':
            app = childProcess.spawn('./build/nw');
            break;
        case 'windows':
            app = childProcess.spawn('build/nw.exe');
            break;
    }
    
    app.stdout.pipe(process.stdout);
    app.stderr.pipe(process.stderr);
    
    app.on('close', function (code) {
        // Kill this gulp (watch) process when application closes.
        process.exit();
    });
});
