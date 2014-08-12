// Starts the app in /build folder and fires gulp watch while the app is opened.

'use strict';

var childProcess = require('child_process');
var utils = require('./internal/utils');

// First start the gulp watch

var watch = childProcess.spawn('node', ['./node_modules/.bin/gulp', 'watch', '--color']);
watch.stdout.pipe(process.stdout);
watch.stderr.pipe(process.stderr);

// Then start the app
var app;
switch (utils.os()) {
    case 'osx':
        app = childProcess.spawn('open', ['./build/node-webkit.app']);
        break;
    case 'linux':
        app = childProcess.spawn('./build/nw');
        break;
    case 'windows':
        app = childProcess.spawn('./build/nw.exe');
        break
}
app.stdout.pipe(process.stdout);
app.stderr.pipe(process.stderr);
app.on('close', function (code) {
    // Kill watch process when application closes.
    watch.kill();
});
