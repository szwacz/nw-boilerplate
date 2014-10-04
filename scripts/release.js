'use strict';

var pathUtil = require('path');
var childProcess = require('child_process');
var projectDir = require('fs-jetpack').cwd(__dirname, '..');

var utils = require('./internal/utils');

var devManifest = projectDir.read('package.json', 'json');
var appManifest = projectDir.read('app/package.json', 'json');

var releases = projectDir.dir('./releases');
var tmpDir = projectDir.dir('./tmp', { empty: true });

var cleanAfter = function () {
    tmpDir.remove('.');
};

var build = function (callback) {
    var gulp = childProcess.spawn('node', ['./node_modules/gulp/bin/gulp', 'build', '--color', '--target=release']);
    gulp.stdout.pipe(process.stdout);
    gulp.stderr.pipe(process.stderr);
    
    gulp.stdout.on('data', function (data) {
        // Look for the info that gulp has finished building so we can carry on.
        var msg = data.toString();
        if (msg.indexOf("Finished") > -1 && msg.indexOf("build") > -1) {
            callback();
        }
    });
};

// -------------------------------------
// Windows
// -------------------------------------

var forWindows = function () {
    var filename = appManifest.name + '_' + appManifest.version + '.exe';
    var installScript = projectDir.read('./os/windows/installer.nsi');
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
    projectDir.write('./tmp/installer.nsi', installScript);
    
    console.log('Starting NSIS...');
    
    // Note: NSIS have to be added to PATH!
    var nsis = childProcess.spawn('makensis', ['.\\tmp\\installer.nsi']);
    nsis.stdout.pipe(process.stdout);
    nsis.stderr.pipe(process.stderr);
    nsis.on('close', cleanAfter);
};

// -------------------------------------
// Linux
// -------------------------------------

var forLinux = function () {
    var packName = appManifest.name + '_' + appManifest.version;
    var pack = tmpDir.dir(packName);
    var debFileName = packName + '_amd64.deb';
    
    console.log('Creating DEB package...');
    
    // The whole app will be installed into /opt directory
    projectDir.copy('build', pack.path('opt', appManifest.name));
    
    // Create .desktop file from the template
    var desktop = projectDir.read('os/linux/app.desktop');
    desktop = utils.replace(desktop, {
        name: appManifest.name,
        prettyName: appManifest.prettyName,
        description: appManifest.description,
        version: appManifest.version,
        author: appManifest.author
    });
    pack.write('usr/share/applications/' + appManifest.name + '.desktop', desktop);
    
    // Counting size of the app in KB
    var appSize = Math.round(projectDir.inspectTree('build').size / 1024);
    
    // Preparing debian control file
    var control = projectDir.read('os/linux/DEBIAN/control');
    control = utils.replace(control, {
        name: appManifest.name,
        description: appManifest.description,
        version: appManifest.version,
        author: appManifest.author,
        size: appSize
    });
    pack.write('DEBIAN/control', control);
    
    // Build the package...
    childProcess.exec('fakeroot dpkg-deb -Zxz --build ' + pack.path() + ' ' + releases.path(debFileName),
        function (error, stdout, stderr) {
            if (error || stderr) {
                console.log("ERROR while building DEB package:");
                console.log(error);
                console.log(stderr);
            } else {
                console.log('Package ' + debFileName + ' ready!');
            }
            cleanAfter();
        });
};

// -------------------------------------
// OSX
// -------------------------------------

var forOsx = function () {
    var appdmg = require('appdmg');
    var dmgName = appManifest.name + '_' + appManifest.version + '.dmg';
    
    // Change app bundle name to desired
    projectDir.rename("build/node-webkit.app", appManifest.prettyName + ".app");
    
    // Prepare appdmg config
    var dmgManifest = projectDir.read('os/osx/appdmg.json');
    dmgManifest = utils.replace(dmgManifest, {
        prettyName: appManifest.prettyName,
        appPath: projectDir.path("build/" + appManifest.prettyName + ".app"),
        dmgIcon: projectDir.path("os/osx/dmg-icon.icns"),
        dmgBackground: projectDir.path("os/osx/dmg-background.png")
    });
    tmpDir.write('appdmg.json', dmgManifest);
    
    // Delete dmg with this name if already exists
    releases.file(dmgName, { exists: false });
    
    console.log('Packaging to DMG image...');
    
    appdmg(tmpDir.path('appdmg.json'), releases.path(dmgName), function (err, path) {
        cleanAfter();
        console.log('Done!');
        console.log('Packaged to: ' + path);
    });
};

// -------------------------------------
// Let's get started...
// -------------------------------------

build(function () {
    var doRelease = {
        'windows': forWindows,
        'linux': forLinux,
        'osx': forOsx
    };
    doRelease[utils.os()]();
});
