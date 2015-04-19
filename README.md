nw-boilerplate
==============
Comprehensive boilerplate application for [NW.js](https://github.com/nwjs/nw.js).  

This project gives you mainly three things:

1. Crossplatform development environment (works the same way on OSX, Windows and Linux).
2. Basic structure for NW.js app.
3. Scripts to generate installers of your app for all three operating systems.

# Quick start
The only development dependency of this project is Node.js. So just make sure you have it installed.
Then type three commands known to every Node.js developer...
```
git clone https://github.com/szwacz/nw-boilerplate.git
npm install
npm start
```
... and boom! You have running desktop application on your screen.

# Structure of the project

There are **two** `package.json` files:  

#### 1. For development
Sits on path: `nw-boilerplate/package.json`. Here you declare dependencies for your development environment and build scripts. **This file is not distributed with real application!**

Also here you declare wersion of NW.js runtime you want to use:
```json
"devDependencies": {
  "nw": "^0.12.1"
}
```

#### 2. Application
Sits on path: `nw-boilerplate/app/package.json`. This is **real** manifest of your application, as specified by [NW wiki](https://github.com/nwjs/nw.js/wiki/Manifest-format). Declare your app dependencies here.

There is one extra field in this file you won't find in NW docs: `productName`. Unlike the `name` field, which have to be file-path-freindly (no spaces and strange characters), `productName` could have any characters you like, and it's used as the app name displayed to the user.

### Project's folders

- `app` - code of your application goes here.
- `build` - in this folder lands built, runnable application.
- `releases` - ready to distribute installers will land here.
- `resources` - resources for particular operating system.
- `tasks` - build and development environment scripts.


# Development

#### Installation

```
npm install
```
It will also download NW runtime, and install dependencies for `package.json` inside `app` folder.

#### Starting the app

```
npm start
```

#### Module loader

How about splitting your JavaScript code into modules? This project supports it by new ES6 syntax (thanks to [esperanto](https://github.com/esperantojs/esperanto)). ES6 modules are translated into AMD (RequireJS) modules. The main advantage of this setup is that you can use ES6/RequireJS for your own modules, and at the same time have normal access to node's `require()` to obtain stuff from npm.
```javascript
// Modules you write are required through new ES6 syntax
// (It will be translated into AMD definition).
import myOwnModule from './my_own_module';
// Node.js (npm) modules are required the same way as always
// (so you can still access all the goodness in npm).
var moment = require('moment');
```

#### Unit testing

nw-boilerplate has preconfigured unit test runner ([jasmine](http://jasmine.github.io/2.0/introduction.html)). To run it go with standard:
```
npm test
```
You don't have to declare paths to spec files in any particular place. The runner will search throu the project for all `*.spec.js` files and include them automatically.


# Making a release

To make ready for distribution installer use command:
```
npm run release
```
It will start the packaging process for operating system you are running this command on. Ready for distribution file will be outputted to `releases` directory.

You can create Windows installer only when running on Windows, the same is true for Linux and OSX. So to generate all three installers you need all three operating systems.

**Note:** There are various icon and bitmap files in `os` directory. Those are used in installers and are intended to be replaced by your own.


# Precautions for particular operating system

## Windows
As installer [NSIS](http://nsis.sourceforge.net/Main_Page) is used. You have to install it (version 3.0), and add NSIS folder to PATH in Environment Variables, so it is reachable to scripts in this project (path should look something like `C:/Program Files (x86)/NSIS`).

## Linux
This project requires for node.js to be reachable under `node` name in command line. For example on Ubuntu it is `nodejs` by default, so you need to manully add alias to `node`.

For now only DEB packaging is supported. It should work on any Linux distribution from debian family (but was tested only on Ubuntu).

## OSX
This project uses [appdmg](https://github.com/LinusU/node-appdmg) for creating pretty DMG images. While installing this library it could ask you for some additional development libraries on what you have to agree.


# License

The MIT License (MIT)

Copyright (c) 2014-2015 Jakub Szwacz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
