const path = require('path');
const os= require('os');
const fs= require('fs');
const resizeImg = require('resize-img');
const { app, Menu ,BrowserWindow, ipcMain, shell } = require('electron');

process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV!== 'production';
const isMac = process.platform === 'darwin';
//Windows - win32 , mac - Darwin , Linux - linux

let mainWindow;

//Create the main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev? 1000: 500,
        height: 600,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),

        }
    });
    //open dev tools if in dev env
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));

}
//Create About Window
function createAboutWindow() {
    aboutWindow = new BrowserWindow({
      width: 300,
      height: 300,
      title: 'About Image Resizer',
      icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    });
  
     aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}
  

//App is ready, create main window
app.whenReady().then(() => {
    createMainWindow();

    //Implement Menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on('closed', () => ( mainWindow = null));
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});
//Menu Template
const menu = [
    ...(isMac ? [{

        label: app.name,
        submenu: [
            {
                label: 'About',
                click: createAboutWindow

            },
        ],
    }] : []),
    {
        role: 'fileMenu',
    }, 
    ...(!isMac ? [{
        label: 'Help',
        submenu: [
                    {
                label: 'About',
                click: createAboutWindow
            },
        ],
        }] : []),
];


// Respond to the resize image event
ipcMain.on('image:resize', (e, options) => {
    // console.log(options);
    options.dest = path.join(os.homedir(), 'imageresizer');
    resizeImage(options);
  });
  
  // Resize and save image
  async function resizeImage({ imgPath, height, width, dest }) {
    try {  
      // Resize image
      const newPath = await resizeImg(fs.readFileSync(imgPath), {
        width: +width,
        height: +height,
      });
  
      // Get filename
      const filename = path.basename(imgPath);
  
      // Create destination folder if it doesn't exist
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
  
      // Write the file to the destination folder
      fs.writeFileSync(path.join(dest, filename), newPath);
  
      // Send success to renderer
      mainWindow.webContents.send('image:done');
  
      // Open the folder in the file explorer
      shell.openPath(dest);
    } catch (err) {
      console.log(err);
    }
  }
  
  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    if (!isMac) app.quit();
  });
  
  // Open a window if none are open (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });