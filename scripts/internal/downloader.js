'use strict';

var fs = require('fs');
var request = require('request');
var progress = require('request-progress');
var Q = require('q');

module.exports = function (url, destPath) {
    var deferred = Q.defer();
    
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
    .pipe(fs.createWriteStream(destPath))
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