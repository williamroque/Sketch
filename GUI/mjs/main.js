const {
    app,
} = require('electron');

const path = require('path');

const windowStateKeeper = require('electron-window-state');

const Window = require('./window');

const fixPath = require('fix-path');
fixPath();

const mainWinObject = {
    center: true,
    icon: '../assets/icon.png',
    titleBarStyle: 'hidden',
    minWidth: 950,
    minHeight: 610,
    maxWidth: 1150,
    maxHeight: 770,
};

let mainWin;

const createWindow = () => {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1150,
        defaultHeight: 750
    });

    mainWinObject.width = mainWindowState.width;
    mainWinObject.height = mainWindowState.height;

    mainWin = new Window(mainWinObject);
    
    mainWindowState.manage(mainWin.window);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.exit(0);
    }
});

app.on('activate', () => {
    if (!mainWin || mainWin.window === null) {
        mainWin = createWindow();
    }
});

