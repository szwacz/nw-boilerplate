// Browser modules are required through new ES6 syntax.
import { greet } from './hello/hello_world';
import bonjur from './hello/bonjur/bonjur';

// Node modules are required the same way as always.
var os = require('os');

var tag = document.createElement('p');
tag.innerHTML = greet();
document.body.appendChild(tag);

tag = document.createElement('p');
tag.innerHTML = 'You are on ' + os.platform() + ' platform.';
document.body.appendChild(tag);
