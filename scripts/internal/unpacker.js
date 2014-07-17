'use strict';

var Q = require('q');
var fs = require('fs');
var pathUtil = require('path');
var utils = require('./utils');

// Detects archive type just by examining file extension.
var detectType = function (filePath) {
    if (/\.zip$/.test(filePath)) {
        return 'zip';
    }
    if (/\.tar\.gz$/.test(filePath)) {
        return 'tar';
    }
    return 'unknown';
}

var untar = function(archivePath, destPath) {
    var deferred = Q.defer();
    
    if (utils.os() === 'linux') {
        // On linux use super fast untar provided by the system.
        var childProcess = require('child_process');
        var command = "tar -zxf " + archivePath + " --strip-components=1 -C " + destPath;
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
    } else {
        // On other operating systems use JS implementation (very slow for now).
        var gunzip = require('zlib').createGunzip();
        var tar = require('tar');
        fs.createReadStream(archivePath)
        .pipe(gunzip)
        .pipe(tar.Extract({ path: destPath }))
        .on("error", function (err) {
            console.log('ERROR while unpacking tar:');
            console.log(err);
            deferred.reject();
        })
        .on("end", deferred.resolve);
    }

    return deferred.promise;
};

var unzip = function(archivePath, destPath) {
    var DecompressZip = require('decompress-zip');
    var deferred = Q.defer();
    
    new DecompressZip(archivePath)
    .on('error', function (err) {
        console.log('ERROR while unpacking zip:');
        console.log(err);
        deferred.reject();
    })
    .on('extract', deferred.resolve)
    .extract({ path: destPath });

    return deferred.promise;
}

module.exports = function (archivePath, destPath) {
    var type = detectType(archivePath);
    var unpack = {
        'zip': unzip,
        'tar': untar,
        'unknown': function () {
            throw "Unknown file format. Can't extract.";
        }
    };
    return unpack[type](archivePath, destPath);
};