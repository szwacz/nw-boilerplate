// Downloads node-webkit runtime and unpacks it into proper place.

'use strict';

var Q = require('q');
var childProcess = require('child_process');
var request = require('request');
var progress = require('request-progress');
var projectDir = require('fs-jetpack');
var DecompressZip = require('decompress-zip');
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

var tmpDir = projectDir.dir('tmp');

// Figure out the URL we have to download.
var url = devManifest.config.nodeWebkit.downloadUrls[utils.os()];
// URL has places where we have to inject version we are interested with.
url = utils.replace(url, { version: runtimeVersion });

var filename = url.substr(url.lastIndexOf('/') + 1);
var downloadDest = tmpDir.path(filename);
var unpackedDir = tmpDir.dir('unpacked');

// --------------------------------------------------------
// Main stuff
// --------------------------------------------------------

var download = function () {
    var deferred = Q.defer();
    
    console.log('Downloading node-webkit (' + url + ')');
    process.stdout.write('Progress: 0%');
    
    progress(request(url))
    .on('progress', function (state) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write('Progress: ' + state.percent + '%');
    })
    .on('error', function (err) {
        console.log('Download ERROR:');
        console.log(err);
        deferred.reject();
    })
    .pipe(projectDir.createWriteStream(downloadDest))
    .on('error', function (err) {
        console.log('File write ERROR:');
        console.log(err);
        deferred.reject();
    })
    .on('close', function () {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log('Progress: 100%');
        deferred.resolve();
    });
    
    return deferred.promise;
};

var unpack = function () {
    
    // There is something wrong/buggy with every decompress library for node,
    // so the safest thing is to go for native commands.
    
    var deferred = Q.defer();
    
    switch (utils.os()) {
        
        case 'windows':
            new DecompressZip(downloadDest)
            .on('error', function (err) {
                console.log('ERROR while unpacking zip:');
                console.log(err);
                deferred.reject();
            })
            .on('extract', deferred.resolve)
            .extract({ path: unpackedDir.path() });
            break;
        
        case 'linux':
            var command = "tar -zxf " + downloadDest + " -C " + unpackedDir.path();
            childProcess.exec(command, function (error, stdout, stderr) {
                if (error || stderr) {
                    console.log('ERROR while unpacking tar:');
                    console.log(error);
                    console.log(stderr);
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
            });
            break;
        
        case 'osx':
            var command = "unzip " + downloadDest + " -d " + unpackedDir.path();
            childProcess.exec(command, function (error, stdout, stderr) {
                if (error || stderr) {
                    console.log('ERROR while unpacking zip:');
                    console.log(error);
                    console.log(stderr);
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
            });
            break;
    }
    
    return deferred.promise;
};

var copy = function () {
    var deferred = Q.defer();
    
    // Strip one directory
    var dirname = unpackedDir.list('.')[0];
    unpackedDir = unpackedDir.cwd(dirname);
    
    var promises = unpackedDir.list('.').map(function (filename) {
        return unpackedDir.copyAsync(filename, destDir.path(filename));
    });
    Q.all(promises).then(deferred.resolve, deferred.reject);
    
    return deferred.promise;
};

var finalize = function () {
    var deferred = Q.defer();
    
    tmpDir.remove('.');
    
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

download()
.then(unpack)
.then(copy)
.then(finalize)
.then(function () {
    console.log('Node-webkit ' + runtimeVersion + ' downloaded successfully.');
});