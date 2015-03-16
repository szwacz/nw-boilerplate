// Browser modules are required through new ES6 syntax.
import { greet } from './hello_world/hello_world';

// Node modules are required the same way as always.
var os = require('os');

var greetElement = document.getElementById('greet');
greetElement.innerHTML = greet();

var platform = document.getElementById('platform-info');
platform.innerHTML = os.platform();
