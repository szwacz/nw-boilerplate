'use strict';

var pathUtil = require('path');
var childProcess = require('child_process');
var projectRoot = require('fs-jetpack').cwd(pathUtil.resolve(__dirname, '..'));

var utils = require('./internal/utils');

var devManifest = projectRoot.read('package.json', 'json');
var appManifest = projectRoot.read('app/package.json', 'json');

var releases = projectRoot.dir('./releases');
var tmp = projectRoot.dir('./tmp', { empty: true });

var forWindows = function () {
    var filename = appManifest.name + '-' + appManifest.version + '.exe';
    var installScript = projectRoot.read('./os/windows/installer.nsi');
    installScript = utils.replace(installScript, {
        "name": appManifest.name,
        "prettyName": appManifest.prettyName,
        "src": "..\\build",
        "dest": "..\\releases\\" + filename,
        "icon": "..\\os\\windows\\icon.ico"
    });
    projectRoot.write('./tmp/installer.nsi', installScript);
    
    console.log('Starting NSIS...');
    
    // Note: NSIS have to be added to PATH!
    var nsis = childProcess.spawn('makensis', ['.\\tmp\\installer.nsi']);
    nsis.stdout.pipe(process.stdout);
    nsis.stderr.pipe(process.stderr);
    nsis.on('close', cleanAfter);
};

var forLinux = function () {
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
};

var forOsx = function () {
    var appdmg = require('appdmg');
    var packName = appManifest.name + '-' + appManifest.version;
    var dmgManifest = projectRoot.read('os/osx/appdmg.json');
    dmgManifest = utils.replace(dmgManifest, {
        prettyName: appManifest.prettyName,
        appPath: projectRoot.path("build/node-webkit.app"),
        dmgIcon: projectRoot.path("os/osx/dmg-icon.icns"),
        dmgBackground: projectRoot.path("os/osx/dmg-background.png")
    });
    tmp.write('appdmg.json', dmgManifest);
    appdmg(tmp.path('appdmg.json'), releases.path(packName + '.dmg'), function (err, path) {
        console.log(err);
    });
};

var cleanAfter = function () {
    tmp.remove('.');
};

var doRelease = {
    'windows': forWindows,
    'linux': forLinux,
    'osx': forOsx
};
doRelease[utils.os()]();