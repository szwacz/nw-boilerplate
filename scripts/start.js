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
        break;
}