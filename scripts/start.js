// Starts the app in /build folder and runs gulp watch for the time, when app is running.

'use strict';

var argv = require('yargs').argv;
var childProcess = require('child_process');
var utils = require('./internal/utils');

var target = argv.target || 'development';

// First build the app for specified target...
var gulp = childProcess.spawn('node', ['./node_modules/gulp/bin/gulp', '--color', '--target=' + target]);
gulp.stdout.pipe(process.stdout);
gulp.stderr.pipe(process.stderr);

gulp.stdout.on('data', function (data) {
    // Look for info that gulp has finished building the app to start it.
    var msg = data.toString();
    if (msg.indexOf("Finished") > -1 && msg.indexOf("build") > -1) {
        startApp();
    }
});

var startApp = function () {
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
        // Kill watch process when application closes.
        gulp.kill();
    });
};
