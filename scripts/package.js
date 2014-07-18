'use strict';

var pathUtil = require('path');
var childProcess = require('child_process');
var projectRoot = require('fs-jetpack').cwd(pathUtil.resolve(__dirname, '..'));

var utils = require('./internal/utils');

var devManifest = projectRoot.read('package.json', 'json');
var appManifest = projectRoot.read('app/package.json', 'json');

if (utils.os() === 'windows') {
    projectRoot.dir('./releases')
    var filename = utils.replace("{{app_name}}-v{{version}}.exe", {
        "app_name": appManifest.name,
        "version": appManifest.version
    });
    var installScript = projectRoot.read('./os/windows/installer.nsi');
    installScript = utils.replace(installScript, {
        "src_dir": ".",
        "dest_file": "..\\releases\\" + filename
    });
    projectRoot.write('./build/installer.nsi', installScript);
    // NSIS have to be added to PATH at this moment for this to work
    childProcess.exec('makensis ./build/installer.nsi', function (error, stdout, stderr) {
        if (error || stderr) {
            console.log(error);
            console.log(stderr);
        } else {
            console.log(stdout)
        }
    });
}