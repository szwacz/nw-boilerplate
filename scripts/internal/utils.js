'use strict';

var os = require('os');

module.exports.os = function () {
    switch (os.platform()) {
        case 'darwin':
            return 'osx';
        case 'linux':
            return 'linux';
        case 'win32':
            return 'windows';
    }
    return 'unsupported';
};