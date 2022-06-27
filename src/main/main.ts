/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const fs = require('fs');
const axios = require('axios');

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
// let directoryFiles = [];

let selectedDirectoryFiles = [];

const getFiles = (directoryPath) => {
  // Get all files in selected directory
  const files = fs.readdirSync(directoryPath + '/');
  return files;
};

ipcMain.on('ipc-select-folder', async (event, arg) => {
  // Open dialog for user to select folder
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  // Get all the files in the selected folder and set
  selectedDirectoryFiles = getFiles(result.filePaths + '/');
  event.reply('ipc-select-folder', result.filePaths);
});

const existsInDpsJson = (rawFilename, dpsJson) => {
  // Convert json to array of its values
  const sourcesKeysArray = Object.keys(dpsJson.sources);
  const found = sourcesKeysArray.find((key) => key === rawFilename);
  return found;
};

const getSheetJson = async () => {
  try {
    const res = await axios.get(
      'http://localhost:10200/dps/data/16Yyf7XpMsFUl0IhAXCU_6Oh_-1Ul_OZxVeoOpz88MmE/0/*?proxy=http://localhost:10200'
    );
    return res.data;
  } catch (error) {
    return false;
    event.reply('ipc-get-json-file', 'ERROR LOADING SHEET JSON');
  }
};

const getDpsJson = async (path) => {
  try {
    const dpsJsonRawData = fs.readFileSync(path);
    return JSON.parse(dpsJsonRawData);
  } catch (error) {
    return {};
  }
};

ipcMain.on('ipc-get-json-file', async (event, dpsJsonPath) => {
  // Get and read Sheet JSON from url
  // console.log('WE FOUND THESE FILES!!!!!', selectedDirectoryFiles);
  const gotJson = await getSheetJson();
  if (gotJson) {
    console.log('GOT THE JSON', gotJson);
  } else {
    console.log('DID NOT GET THE JSON');
    return;
  }
  const sheetJsonData = gotJson;

  // Get and read from existing DPS JSON file
  const dpsJsonFile = dpsJsonPath + '/dps.json';
  const currentDpsJsonObj = await getDpsJson(dpsJsonFile);

  // Convert sheet json to array of its values
  const sheetDataArray = Object.values(sheetJsonData);

  let newSourcesObj = {};

  // Iterate through all files in folder
  selectedDirectoryFiles.forEach((file) => {
    // Strip the file extension
    const rawFilename = file;
    const strippedFilename = file.slice(0, -4);

    // Iterate sheet data array to check if it contains a matching filename
    sheetDataArray.forEach((obj) => {
      if (strippedFilename === obj.Filename) {
        // We found this file in the sheet

        // Now check if its already in the existing DPS json
        // If it is then don't touch it, if its not then Add it
        const found = existsInDpsJson(rawFilename, currentDpsJsonObj);
        if (!found) {
          // so add it to the NEW DPS json object
          newSourcesObj[rawFilename] = {
            rid: obj.ID,
          };
          console.log('/////////////////////////////////////////');
          console.log('ADDING NEW OBJ TO DPS JSON====');
          console.log('FILENAME====', rawFilename);
          console.log('RID====', obj.ID);
          console.log('/////////////////////////////////////////');
        } else {
          console.log('/////////////////////////////////////////');
          console.log('ALREADY EXISTS IN DPS JSON====');
          console.log('FILENAME====', rawFilename);
          console.log('RID====', obj.ID);
          console.log('/////////////////////////////////////////');
        }
      }
    });
  });

  console.log('NEW SOURCES OBJ=======', newSourcesObj);

  // Write new sources back to file
  // fs.writeFileSync(jsonFile, 'ass');
  // const response = [JSON.parse(res.data), oldJson];

  event.reply('ipc-get-json-file', 'PROCESS COMPLETE');
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
