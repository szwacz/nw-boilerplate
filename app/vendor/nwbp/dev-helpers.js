// When application runs in development mode this
// module activates convenient shortcuts for you.

(function () {
    'use strict';
    
    var gui = require('nw.gui');
    
    var registerShortcuts = function () {
        var cmdPressed = false;
        
        var keyDown = function (e) {
            if (e.keyCode == 91 || e.keyCode == 93) {
                cmdPressed = true;
            }
        };
        
        var keyUp = function (e) {
            if (e.keyCode == 91 || e.keyCode == 93) {
                cmdPressed = false;
            }
            if ((e.ctrlKey || cmdPressed) && e.keyCode == 82) {
                // CTRL (CMD) + R reloads the page
                gui.Window.get().reload();
            }
            if ((e.ctrlKey || cmdPressed) && e.shiftKey && e.keyCode == 73) {
                // CTRL (CMD) + SHIFT + I shows devtools window
                gui.Window.get().showDevTools();
            }
        };
        
        document.addEventListener('keydown', keyDown, false);
        document.addEventListener('keyup', keyUp, false);
    };
    
    if (gui.App.manifest.developmentMode) {
        registerShortcuts();
    }
  
}());
