// The hack for problems with libudev.so.0 on Linux platform.
// Read more: https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0

'use strict';

var pathUtil = require('path');
var childProcess = require('child_process');

var command = "sed -i 's/udev\.so\.0/udev.so.1/g' nw";
var cwd = pathUtil.resolve(__dirname, '../../runtime/linux');

childProcess.exec(command, { cwd: cwd }, function (error, stdout, stderr) {
    if (error || stderr) {
        console.log('ERROR while patching:');
        console.log(error);
        console.log(stderr);
    } else {
        console.log(stdout)
    }
});