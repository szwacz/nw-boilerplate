// This gives you default context menu (cut, copy, paste)
// in all input fields and textareas across your app.

(function () {
    'use strict';
    
    var gui = require('nw.gui');
    
    var cut = new gui.MenuItem({
        label: "Cut",
        click: function () {
            document.execCommand("cut");
        }
    });
    
    var copy = new gui.MenuItem({
        label: "Copy",
        click: function () {
            document.execCommand("copy");
        }
    })
    
    var paste = new gui.MenuItem({
        label: "Paste",
        click: function () {
            document.execCommand("paste");
        }
    });
    
    var textMenu = new gui.Menu();
    textMenu.append(cut);
    textMenu.append(copy);
    textMenu.append(paste);
    
    document.addEventListener('contextmenu', function(e) {
        
        switch (e.target.nodeName) {
            case 'TEXTAREA':
            case 'INPUT':
                e.preventDefault();
                textMenu.popup(e.x, e.y);
                break;
        }
        
    }, false);
  
}());
