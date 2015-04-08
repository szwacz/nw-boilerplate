// Window state (size and position) preservation between app launches.
(function () {
    'use strict';

    var gui = require('nw.gui');
    var win = gui.Window.get();
    var state;
    var currMode = 'normal';
    var maximized = null;
    var saveTimeout;

    var init = function () {
        try {
            state = JSON.parse(localStorage.windowState);

            // Make sure the window is in-bounds of the screen.
            // If not, it is safer to ignore it.
            if (state.x < -10 ||
                state.y < -10 ||
                state.x + state.width > screen.width + 10 ||
                state.y + state.height > screen.height + 10) {
                throw "Window out of bounds.";
            }

            // Restore saved window state.
            currMode = state.mode;
            win.resizeTo(state.width, state.height);
            win.moveTo(state.x, state.y);
            if (currMode === 'maximized') {
                // Have to delay maximization a little to let NW set
                // the normal x,y,width,height of the window,
                // so we can unmaximize to that state later on.
                // It also prevents bug https://github.com/nwjs/nw.js/issues/1105
                setTimeout(function () {
                    win.maximize();
                    maximized = snapshotWindowSize();
                }, 100);
            }
        } catch (err) {
            // There was no data, or data has been corrupted.
            // Start from scratch with safe defaults.
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

    // We are delaying save for one second to be sure window state
    // has "stabilized" (order of events is sometimes unreliable,
    // and we can save some junk by not waiting).
    var scheduleSave = function () {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(save, 1000);
    };

    var snapshotWindowSize = function (obj) {
        obj = obj || {};
        obj.x = win.x;
        obj.y = win.y;
        obj.width = win.width;
        obj.height = win.height;
        return obj;
    }

    var save = function () {
        if (currMode === 'minimized') {
            // Don't save minimized state.
            return;
        }
        if (currMode === 'normal') {
            // Update window dimensions only if in normal mode.
            snapshotWindowSize(state);
        }
        if (currMode === 'maximized') {
            // Save maximized dimensions into separate object.
            maximized = snapshotWindowSize();
        }
        state.mode = currMode;
        localStorage.windowState = JSON.stringify(state);
    };

    init();

    win.on('maximize', function () {
        currMode = 'maximized';
        scheduleSave();
    });

    win.on('unmaximize', function () {
        currMode = 'normal';
        scheduleSave();
    });

    win.on('minimize', function () {
        currMode = 'minimized';
        // Don't save minimized state.
    });

    win.on('restore', function () {
        currMode = 'normal';
        scheduleSave();
    });

    win.on('resize', function () {
        if (maximized && (win.width !== maximized.width || win.height !== maximized.height)) {
            // On OSX you can resize maximized window, so it is no longer maximized.
            maximized = null;
            currMode = 'normal';
        }
        scheduleSave();
    });

    win.on('move', function () {
        scheduleSave();
    });

}());
