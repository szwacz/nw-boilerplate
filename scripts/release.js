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
        "version": appManifest.version,
        "src": "..\\build",
        "dest": "..\\releases\\" + filename,
        "icon": "..\\os\\windows\\icon.ico",
        "setupIcon": "..\\os\\windows\\setup-icon.ico",
        "banner": "..\\os\\windows\\setup-banner.bmp"
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
    
    console.log('Creating DEB package...');
    
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
    
    // Counting size of the app in KB
    var appSize = Math.round(projectRoot.tree('build').size / 1024);
    
    var control = projectRoot.read('os/linux/DEBIAN/control');
    control = utils.replace(control, {
        name: appManifest.name,
        description: appManifest.description,
        version: appManifest.version,
        author: appManifest.author,
        size: appSize
    });
    pack.write('DEBIAN/control', control);
    
    var deb = childProcess.spawn('fakeroot', ['dpkg-deb', '--build', pack.path(), releases.path(packName + '.deb')]);
    deb.stdout.pipe(process.stdout);
    deb.stderr.pipe(process.stderr);
    deb.on('close', function () {
        cleanAfter();
        console.log('Done!');
    });
};

var forOsx = function () {
    var appdmg = require('appdmg');
    var dmgName = appManifest.name + '-' + appManifest.version + '.dmg';
    
    // Change app bundle name to desired
    projectRoot.rename("build/node-webkit.app", appManifest.prettyName + ".app");
    
    // Prepare appdmg config
    var dmgManifest = projectRoot.read('os/osx/appdmg.json');
    dmgManifest = utils.replace(dmgManifest, {
        prettyName: appManifest.prettyName,
        appPath: projectRoot.path("build/" + appManifest.prettyName + ".app"),
        dmgIcon: projectRoot.path("os/osx/dmg-icon.icns"),
        dmgBackground: projectRoot.path("os/osx/dmg-background.png")
    });
    tmp.write('appdmg.json', dmgManifest);
    
    // Delete dmg with this name if already exists
    releases.file(dmgName, { exists: false });
    
    console.log('Packaging to DMG image...');
    
    appdmg(tmp.path('appdmg.json'), releases.path(dmgName), function (err, path) {
        cleanAfter();
        console.log('Done!');
        console.log('Packaged to: ' + path);
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
