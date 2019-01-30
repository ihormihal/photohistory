const electron = require('electron')
const fs = require('fs')
const path = require('path')
const electronLocalshortcut = require('electron-localshortcut')
const utils = require('./utils')

const { app, BrowserWindow, ipcMain, Menu, dialog, globalShortcut } = electron


let mainWindow

const handleOpenFolder = () => {
    
    dialog.showOpenDialog({
        title: 'Select Folder',
        defaultPath: app.getPath('documents'),
        properties: ['openDirectory']
    }, (path) => {
        if(path && path.length){
            console.log(path[0])
        }
    })
}

const handleOpenFile = () => {
    dialog.showOpenDialog({
        title: 'Select JSON file',
        defaultPath: app.getPath('documents'),
        properties: ['openFile'],
        filters: [
            { name: 'JSON', extensions: ['json'] } 
        ]
    }, (selectedPath) => {
        if(selectedPath && selectedPath.length){
            fs.readFile(selectedPath[0], 'utf8', function(err, contents) {
                mainWindow.webContents.send('path:loaded', path.dirname(selectedPath[0]) + '/')
                mainWindow.webContents.send('images:loaded', JSON.parse(contents))
            })
        }
    })
}

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open JSON scan',
                accelerator: process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
                click() {
                    console.log('Open JSON scan')
                    handleOpenFile()
                }
            }
        ]
    }
]

if(process.env.NODE_ENV !== 'production'){
    menuTemplate.push({
        label: 'DevTools',
        submenu: [
            {
                label: "Toggle DevTools",
                accelerator: process.platform === 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, window) {
                    window.toggleDevTools()
                }
            },
            {
                role: 'reload'
            }
        ] 
    })
}

if(process.platform === 'darwin'){
    menuTemplate.unshift({
        label: app.getName(),
        submenu: [
            { role: 'about' },
            { role: 'quit' }
        ]
    })
}

const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)


app.on('ready', () => {
    mainWindow = new BrowserWindow({})
    mainWindow.loadFile('main.html')
    mainWindow.webContents.openDevTools()

    mainWindow.on('closed', () => {
        mainWindow = null
        previewWindow = null
    })

    // ipcMain.on('image:preview', (e, index) => {
    //     previewImage(index)
    // })
})

app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})