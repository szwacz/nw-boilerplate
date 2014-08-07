// Window state (size and position) preservation between app launches.
(function () {
    'use strict';
    
    var gui = require('nw.gui');
    var win = gui.Window.get();
    var state;
    var currMode = 'normal';
    var maximizationJustHappened = false;
    
    var init = function () {
        try {
            state = JSON.parse(localStorage.windowState);
            // Restore saved window state.
            currMode = state.mode;
            win.resizeTo(state.width, state.height);
            win.moveTo(state.x, state.y);
            if (currMode === 'maximized') {
                // Have to delay maximization a little to let NW set
                // the normal x,y,width,height of the window,
                // so we can unmaximize to that state later on.
                setTimeout(function () {
                    win.maximize();
                }, 100);
            }
        } catch (err) {
            // There was no data, or data has been corrupted.
            // Start from scratch.
            state = {
                mode: currMode,
                x: win.x,
                y: win.y,
                width: win.width,
                height: win.height
            };
        }
        
        win.show();
    };
    
    var onEvent = function (eventName) {
        console.log('onEvent', eventName)
        switch (eventName) {
            case 'maximize':
                maximizationJustHappened = true;
                setTimeout(function () {
                    // Switch it back after 0.5 sec.
                    maximizationJustHappened = false;
                }, 500);
                currMode = 'maximized';
                state.mode = currMode;
                save();
                break;
            case 'unmaximize':
                currMode = 'normal';
                state.mode = currMode;
                save();
                break;
            case 'minimize':
                currMode = 'minimized';
                // Don't save minimized state (it makes no sense),
                // leave in storage the last normal or maximized state.
                break;
            case 'unminimize':
                currMode = 'normal';
                state.mode = currMode;
                save();
                break;
            case 'resize':
                if (!maximizationJustHappened && currMode === 'maximized') {
                    // On OSX you can resize maximized window, so it is no longer maximized.
                    currMode = 'normal';
                }
                if (currMode === 'normal') {
                    // Save new dimensions only if normal state,
                    // in other states they have no meaning to us.
                    state.width = win.width;
                    state.height = win.height;
                    save();
                }
                break;
            case 'move':
                if (currMode === 'normal') {
                    // Save new dimensions only if normal state,
                    // in other states they have no meaning to us.
                    state.x = win.x;
                    state.y = win.y;
                    save();
                }
                break;
        }
    };
    
    var save = function () {
        localStorage.windowState = JSON.stringify(state);
        console.log("saved:", JSON.stringify(state));
    }; 
    
    init();
    
    win.on('maximize', function () {
        onEvent('maximize');
    });
    
    win.on('unmaximize', function () {
        onEvent('unmaximize');
    });
    
    win.on('minimize', function () {
        onEvent('minimize');
    });
    
    win.on('restore', function () {
        onEvent('unminimize');
    });
    
    win.on('resize', function () {
        onEvent('resize');
    });
    
    win.on('move', function () {
        onEvent('move');
    });
    
}());