// Starts the app in /build folder and runs gulp watch for the time, when app is running.

'use strict';

var childProcess = require('child_process');
var utils = require('./internal/utils');

var watch = childProcess.spawn('node', ['./node_modules/gulp/bin/gulp', 'watch', '--color']);
watch.stdout.pipe(process.stdout);
watch.stderr.pipe(process.stderr);

var app;
// Execute correct commands for this OS
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
    watch.kill();
});
