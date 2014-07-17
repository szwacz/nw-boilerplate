// Downloads node-webkit runtime and unpacks it into proper place.

'use strict';

var pathUtil = require('path');
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
    
    // For linux we need to apply the patch/hack for libudev
    if (utils.os() === 'linux') {
        require('./internal/patch_libudev');
    }
});