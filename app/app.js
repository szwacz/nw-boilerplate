// Browser modules are required through new ES6 syntax.
import helloWorld from 'helpers/hello_world';

// Node modules are required the same way as always.
var os = require('os');

var tag = document.createElement('p');
tag.innerHTML = helloWorld.greet();
document.body.appendChild(tag);

tag = document.createElement('p');
tag.innerHTML = 'You are on ' + os.platform() + ' platform.';
document.body.appendChild(tag);
