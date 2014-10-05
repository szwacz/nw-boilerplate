// When application runs in development mode this
// module activates convenient shortcuts for you.

(function () {
    'use strict';
    
    var gui = require('nw.gui');
    
    var registerShortcuts = function () {
        var keyDown = function (e) {
            if ((e.ctrlKey || e.metaKey) && e.keyCode == 82) {
                // CTRL (CMD) + R reloads the page
                gui.Window.get().reload();
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode == 73) {
                // CTRL (CMD) + SHIFT + I shows devtools window
                gui.Window.get().showDevTools();
            }
        };
        
        document.addEventListener('keydown', keyDown, false);
    };
    
    if (gui.App.manifest.developmentMode) {
        registerShortcuts();
    }
  
}());
