'use strict';

var childProcess = require('child_process');

var utils = require('./internal/utils');

switch (utils.os()) {
    case 'osx':
        break;
    case 'linux':
        childProcess.spawn('./build/nw');
        process.exit();
        break;
    case 'windows':
        childProcess.execFile('./build/nw.exe', function (error, stdout, stderr) {
            if (error || stderr) {
                console.log(error);
                console.log(stderr);
            } else {
                console.log(stdout)
            }
        });
        //process.exit();
        break;
}