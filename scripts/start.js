// Starts the app in /build folder and fires gulp watch while the app is opened.

'use strict';

var childProcess = require('child_process');
var utils = require('./internal/utils');

// First start the gulp watch

var watch = childProcess.spawn('node', ['./node_modules/gulp/bin/gulp', 'watch', '--color']);
watch.stdout.pipe(process.stdout);
watch.stderr.pipe(process.stderr);

// Then start the app

var commands = {
    'osx': 'open ./build/node-webkit.app',
    'linux': './build/nw',
    'windows': './build/nw.exe'
};

var app = childProcess.spawn(commands[utils.os()]);
app.stdout.pipe(process.stdout);
app.stderr.pipe(process.stderr);
app.on('close', function (code) {
    // Kill watch process when application closes.
    watch.kill();
});