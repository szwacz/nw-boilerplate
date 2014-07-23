'use strict';

var pathUtil = require('path');
var childProcess = require('child_process');
var projectRoot = require('fs-jetpack').cwd(pathUtil.resolve(__dirname, '..'));

var utils = require('./internal/utils');

var devManifest = projectRoot.read('package.json', 'json');
var appManifest = projectRoot.read('app/package.json', 'json');

var releases = projectRoot.dir('./releases');
var tmp = projectRoot.dir('tmp', { empty: true });

if (utils.os() === 'linux') {
    var packName = appManifest.name + '-' + appManifest.version;
    var pack = tmp.dir(packName);
    
    projectRoot.copy('build', pack.path('opt', appManifest.name));
    
    var desktop = projectRoot.read('os/linux/app.desktop');
    desktop = utils.replace(desktop, {
        name: appManifest.name,
        prettyName: appManifest.prettyName,
        description: appManifest.description,
        version: appManifest.version,
        author: appManifest.author
    });
    pack.write('usr/share/applications/' + appManifest.name + '.desktop', desktop);
    
    var control = projectRoot.read('os/linux/DEBIAN/control');
    control = utils.replace(control, {
        name: appManifest.name,
        description: appManifest.description,
        version: appManifest.version,
        author: appManifest.author
    });
    pack.write('DEBIAN/control', control);
    
    childProcess.exec('dpkg-deb --build ' + pack.path() + ' ' + releases.path(packName + '.deb'), function (error, stdout, stderr) {
        if (error || stderr) {
            console.log(error);
            console.log(stderr);
        } else {
            console.log(stdout)
        }
    });
}

if (utils.os() === 'windows') {
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