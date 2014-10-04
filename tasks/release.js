'use strict';

var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var childProcess = require('child_process');
var projectDir = require('fs-jetpack');
var utils = require('./utils');

var releaseForOs = {};

var tmpDir = projectDir.dir('./tmp', { empty: true });
var cleanTmp = function () {
    tmpDir.remove('.');
};

// -------------------------------------
// OSX
// -------------------------------------

releaseForOs.osx = function (callback) {
    var appdmg = require('appdmg');
    
    var releasesDir = projectDir.dir('./releases');
    var manifest = projectDir.read('app/package.json', 'json');
    var dmgName = manifest.name + '_' + manifest.version + '.dmg';
    
    // Change app bundle name to desired
    projectDir.rename("build/node-webkit.app", manifest.prettyName + ".app");
    
    // Prepare appdmg config
    var dmgManifest = projectDir.read('os/osx/appdmg.json');
    dmgManifest = utils.replace(dmgManifest, {
        prettyName: manifest.prettyName,
        appPath: projectDir.path("build/" + manifest.prettyName + ".app"),
        dmgIcon: projectDir.path("os/osx/dmg-icon.icns"),
        dmgBackground: projectDir.path("os/osx/dmg-background.png")
    });
    tmpDir.write('appdmg.json', dmgManifest);
    
    // Delete dmg with this name if already exists
    releasesDir.file(dmgName, { exists: false });
    
    gulpUtil.log('Packaging to DMG image...');
    
    appdmg(tmpDir.path('appdmg.json'), releasesDir.path(dmgName), function (err, path) {
        gulpUtil.log('DMG image', path, 'ready!');
        cleanTmp();
        callback();
    });
};

// -------------------------------------
// Linux
// -------------------------------------

releaseForOs.linux = function (callback) {
    var releasesDir = projectDir.dir('./releases');
    var manifest = projectDir.read('app/package.json', 'json');
    var packName = manifest.name + '_' + manifest.version;
    var pack = tmpDir.dir(packName);
    var debFileName = packName + '_amd64.deb';
    
    gulpUtil.log('Creating DEB package...');
    
    // The whole app will be installed into /opt directory
    projectDir.copy('build', pack.path('opt', manifest.name));
    
    // Create .desktop file from the template
    var desktop = projectDir.read('os/linux/app.desktop');
    desktop = utils.replace(desktop, {
        name: manifest.name,
        prettyName: manifest.prettyName,
        description: manifest.description,
        version: manifest.version,
        author: manifest.author
    });
    pack.write('usr/share/applications/' + manifest.name + '.desktop', desktop);
    
    // Counting size of the app in KB
    var appSize = Math.round(projectDir.inspectTree('build').size / 1024);
    
    // Preparing debian control file
    var control = projectDir.read('os/linux/DEBIAN/control');
    control = utils.replace(control, {
        name: manifest.name,
        description: manifest.description,
        version: manifest.version,
        author: manifest.author,
        size: appSize
    });
    pack.write('DEBIAN/control', control);
    
    // Build the package...
    childProcess.exec('fakeroot dpkg-deb -Zxz --build ' + pack.path() + ' ' + releasesDir.path(debFileName),
        function (error, stdout, stderr) {
            if (error || stderr) {
                console.log("ERROR while building DEB package:");
                console.log(error);
                console.log(stderr);
            } else {
                gulpUtil.log('Package', debFileName, 'ready!');
            }
            cleanTmp();
            callback();
        });
};

// -------------------------------------
// Windows
// -------------------------------------

releaseForOs.windows = function (callback) {
    var manifest = projectDir.read('app/package.json', 'json');
    var filename = manifest.name + '_' + manifest.version + '.exe';
    var installScript = projectDir.read('./os/windows/installer.nsi');
    installScript = utils.replace(installScript, {
        "name": manifest.name,
        "prettyName": manifest.prettyName,
        "version": manifest.version,
        "src": "..\\build",
        "dest": "..\\releases\\" + filename,
        "icon": "..\\os\\windows\\icon.ico",
        "setupIcon": "..\\os\\windows\\setup-icon.ico",
        "banner": "..\\os\\windows\\setup-banner.bmp"
    });
    projectDir.write('./tmp/installer.nsi', installScript);
    
    gulpUtil.log('Building installer with NSIS...');
    
    // Note: NSIS have to be added to PATH!
    var nsis = childProcess.spawn('makensis', ['.\\tmp\\installer.nsi']);
    nsis.stdout.pipe(process.stdout);
    nsis.stderr.pipe(process.stderr);
    nsis.on('close', function () {
        gulpUtil.log('Installer', filename, 'ready!');
        cleanTmp();
        callback();
    });
};

// -------------------------------------
// The task
// -------------------------------------

// Wire release name to specyfic release process for this operating system.
gulp.task('release', ['build'], function (callback) {
    return releaseForOs[utils.os()](callback);
});