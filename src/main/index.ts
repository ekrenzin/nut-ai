import { app, shell, BrowserWindow, ipcMain, desktopCapturer } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { screen, windowWithTitle, getWindows, Window as NutWindow } from "@nut-tree/nut-js";
import "@nut-tree/element-inspector";
import { useBoltWindowFinder } from '@nut-tree/bolt'
import { configure, Language, LanguageModelType, preloadLanguages } from "@nut-tree/plugin-ocr";
import {elements} from "@nut-tree/element-inspector/win";

configure({
  languageModelType: LanguageModelType.BEST
});
// useBolt()
useBoltWindowFinder()
preloadLanguages([Language.English, Language.German]);

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.handle('listWindows', async () => {
    const sources = await desktopCapturer.getSources({ types: ['window'] })
    const windows = await getWindows()
    const mappedWindows = await Promise.all(windows.map(async (win) => {
      return {
        title: await win.title
      }
    }))
    //only return windows desktopCapturer can see
    return mappedWindows.filter((win) => sources.some((source) => normalizeTitle(source.name) === normalizeTitle(win.title)))
  })

  ipcMain.handle('getWindow', async (event, arg) => {
    const { title } = arg
    const window = await screen.find(windowWithTitle(title))
    await window.focus();
    const elements = await window.getElements(5)
    
    return [elements]
  })

  ipcMain.handle('getInteractables', async (event, arg) => {
    const { title } = arg
    const window = await screen.find(windowWithTitle(title))
    await window.focus();
    const editFields = await window.findAll(elements.editField({ title: /^(?!\s*$).+/ }));
    const buttons = await window.findAll(elements.button({ title: /^(?!\s*$).+/ }));
    const groups = await window.findAll(elements.group({ title: /^(?!\s*$).+/ }));
    const textBoxes = await window.findAll(elements.textBox({ title: /^(?!\s*$).+/ }));

    const interactables = [editFields, buttons, groups, textBoxes].map((element) => {
      console.log(element)
      return element.map((el) => {
        return {
          title: el.title,
          region: el.region,
          type: el.type
        }
      })
    })
    
      
    return interactables
  })
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
function normalizeTitle(title) {
  return title.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .replace(/[^a-z0-9]/gi, '') // Remove all non-alphanumeric characters
    .toLowerCase(); // Convert to lowercase
}