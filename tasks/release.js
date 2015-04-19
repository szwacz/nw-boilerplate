'use strict';

var gulp = require('gulp');
var utils = require('./utils');

var releaseForOs = {
    osx: require('./release_osx')
};

gulp.task('release', ['build'], function () {
    return releaseForOs[utils.os()]();
});
