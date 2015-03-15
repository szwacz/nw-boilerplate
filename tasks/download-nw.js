// Downloads NW.js runtime and unpacks it into proper place.

'use strict';

var Q = require('q');
var childProcess = require('child_process');
var projectDir = require('fs-jetpack');
var utils = require('./utils');

// --------------------------------------------------------
// Preparations
// --------------------------------------------------------

var devManifest = projectDir.read('package.json', 'json');
var appManifest = projectDir.read('app/package.json', 'json');

// Version of NW.js we need
var runtimeVersion = devManifest.config.nw.version;
// The directory where runtime should be placed
var destDir = projectDir.dir('nw/' + utils.os());

// First check if we already haven't downloaded this version of runtime.
if (destDir.read('version') === runtimeVersion) {
    // No need for continuing
    process.exit();
}

// Figure out the URL we have to download.
var url = devManifest.config.nw.downloadUrls[utils.os()];
// URL has places where we have to inject version we are interested with.
url = utils.replace(url, { version: runtimeVersion });

var finalize = function () {
    var deferred = Q.defer();

    // Place file with version next to downloaded runtime,
    // so we know in the future what we have there.
    destDir.file('version', { content: runtimeVersion });

    // Special preparations necessary for linux runtime
    if (utils.os() === 'linux') {
        // The hack for problems with libudev.so.0 on Linux platform.
        // Read more: https://github.com/nwjs/nw.js/wiki/The-solution-of-lacking-libudev.so.0
        childProcess.exec("sed -i 's/udev\.so\.0/udev.so.1/g' nw", { cwd: destDir.path() },
            function (error, stdout, stderr) {
                if (error || stderr) {
                    console.log('ERROR while patching libudev:');
                    console.log(error);
                    console.log(stderr);
                } else {
                    deferred.resolve();
                }
            });
    } else {
        deferred.resolve();
    }

    return deferred.promise;
};

// --------------------------------------------------------
// Let's get started
// --------------------------------------------------------

destDir.dir('.', { empty: true });

var Download = require('download');

var download = new Download({ extract: true, strip: 1, mode: '755' })
.get(url)
.dest(destDir.path());

console.log('Downloading NW.js...');

download.run(function (err, files) {
    if (err) {
        console.error(err);
    } else {
        finalize()
        .then(function () {
            console.log('NW.js v' + runtimeVersion + ' downloaded successfully!');
        });
    }
});
