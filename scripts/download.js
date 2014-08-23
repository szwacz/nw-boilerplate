// Downloads node-webkit runtime and unpacks it into proper place.

'use strict';

var pathUtil = require('path');
var childProcess = require('child_process');
var projectRoot = require('fs-jetpack').cwd(pathUtil.resolve(__dirname, '..'));

var utils = require('./internal/utils');
var downloader = require('./internal/downloader');
var unpacker = require('./internal/unpacker');

var devManifest = projectRoot.read('package.json', 'json');
var appManifest = projectRoot.read('app/package.json', 'json');

// Version of Node-Webkit we need
var runtimeVersion = devManifest.config.nodeWebkit.version;
// The directory where runtime should be placed
var destDir = projectRoot.dir('runtime/' + utils.os());

// First check if we already haven't downloaded this version of runtime.
if (destDir.read('version') === runtimeVersion) {
    // No need for continuing
    process.exit();
}

destDir.dir('.', { empty: true });

// Figure out the URL we have to download.
var url = devManifest.config.nodeWebkit.downloadUrls[utils.os()];
// URL has places where we have to inject version we are interested with.
url = url.replace(/{{version}}/g, runtimeVersion);

var filename = url.substr(url.lastIndexOf('/') + 1);
var tmpDir = projectRoot.dir('tmp');
var downloadPath = tmpDir.path(filename);

console.log('Downloading node-webkit (' + url + ')');

downloader(url, downloadPath).then(function () {
    return unpacker(downloadPath, destDir.cwd());
})
.then(function () {
    tmpDir.remove('.');
    
    // Place file with version next to downloaded runtime,
    // so we know in the future what we downloaded.
    destDir.file('version', { content: runtimeVersion });
    
    // Special preparations necessary for linux runtime
    if (utils.os() === 'linux') {
        // The hack for problems with libudev.so.0 on Linux platform.
        // Read more: https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0
        childProcess.exec("sed -i 's/udev\.so\.0/udev.so.1/g' nw", { cwd: destDir.path() }, function (error, stdout, stderr) {
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
                    }
                });
            }
        });
    }
});