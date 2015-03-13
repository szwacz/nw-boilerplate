// Downloads node-webkit runtime and unpacks it into proper place.

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

// Version of Node-Webkit we need
var runtimeVersion = devManifest.config.nodeWebkit.version;
// The directory where runtime should be placed
var destDir = projectDir.dir('nw/' + utils.os());

// First check if we already haven't downloaded this version of runtime.
if (destDir.read('version') === runtimeVersion) {
    // No need for continuing
    process.exit();
}

// Figure out the URL we have to download.
var url = devManifest.config.nodeWebkit.downloadUrls[utils.os()];
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
        // Read more: https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0
        childProcess.exec("sed -i 's/udev\.so\.0/udev.so.1/g' nw", { cwd: destDir.path() },
            function (error, stdout, stderr) {
                if (error || stderr) {
                    console.log('ERROR while patching libudev:');
                    console.log(error);
                    console.log(stderr);
                } else {
                    // Next make sure all files has broad read permission...
                    childProcess.exec("chmod -R a+r .", { cwd: destDir.path() }, function (error, stdout, stderr) {
                        if (error || stderr) {
                            console.log(error);
                            console.log(stderr);
                        } else {
                            // ...and finally that main file has broad execution premission.
                            destDir.file('nw', { mode: '755' });
                            deferred.resolve();
                        }
                    });
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

var download = new Download({ extract: true, strip: 1 })
.get(url)
.dest(destDir.path());

console.log('Downloading node-webkit...');

download.run(function (err, files) {
    if (err) {
        console.error(err);
    } else {
        finalize()
        .then(function () {
            console.log('Node-webkit v' + runtimeVersion + ' downloaded successfully!');
        });
    }
});
