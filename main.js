const electron = require('electron')
const url = require('url')
const fs = require('fs')
const path = require('path')
const recursive = require('recursive-readdir')
const electronLocalshortcut = require('electron-localshortcut')

const utils = require('./utils')

const { app, BrowserWindow, ipcMain, Menu, dialog, globalShortcut } = electron

let mainWindow
let previewWindow
let storedImages
let previewIndex = 0

const findImages = (path) => {
    return new Promise((resolve, reject) => {
        let images = []
        recursive(path, ["!*.{png,gif,jpg,jpeg,JPG,JPEG}"], (err, files) => {
            if(err) {
                reject(err)
                return
            }
            let images = files.map((path) => { 
                return { path }
            })
            resolve(images)
        })
    })
}

const getImagesInfo = (images) => {
    // console.log(images)
    return new Promise((resolve, reject) => {
        for(let i=0;i<images.length;i++){
            (function(index, length){
                fs.stat(images[index].path, (err, info) => {
                    images[index].date = info.birthtime
                    if(index === length-1){
                        resolve(images)
                    }
                })
            })(i, images.length)
        }
    })
}

const resizeImages = (images) => {
    for(let i=0;i<images.length;i++){
        let filename = utils.randomStr()
        let previewPath = `'./cache/'${filename}`
        sharp(images[i].path)
            .resize(200)
            .toFile(previewPath, (err, info) => {
                images.preview = previewPath
            })
    }
    return images
}


const handleOpenFolder = () => {
    
    dialog.showOpenDialog({
        title: 'Select photos folder',
        defaultPath: app.getPath('documents'),
        properties: ['openDirectory']
    }, (path) => {
        if(path && path.length){
            findImages(path[0])
                .then((images) => getImagesInfo(images))
                // .then((images) => resizeImages(images))
                .then((images) => {
                    storedImages = images
                    mainWindow.webContents.send('images:loaded', images)
                })
        }
    })
}

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open Folder',
                accelerator: process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
                click() {
                    console.log('Open Folder')
                    handleOpenFolder()
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

const previewParams = {
    fullscreen: true
}

const previewImage = (index) => {
    previewIndex = index
    if(!previewWindow){
        previewWindow = new BrowserWindow(previewParams)
        previewWindow.on('closed', () => {
            previewWindow = null
        })
        electronLocalshortcut.register(previewWindow, 'Left', () => {
            previewPrev()
        })
        electronLocalshortcut.register(previewWindow, 'Right', () => {
            previewNext()
        })
        electronLocalshortcut.register(previewWindow, 'Esc', () => {
            previewWindow.close()
        })
    }
    previewWindow.loadFile(storedImages[index].path)
}
const previewPrev = () => {
    if(previewIndex > 1) previewImage(previewIndex-1)
}
const previewNext = () => {
    if(previewIndex < storedImages.length - 1) previewImage(previewIndex+1)
}

app.on('ready', () => {
    mainWindow = new BrowserWindow({})
    mainWindow.loadFile('main.html')
    mainWindow.webContents.openDevTools()

    mainWindow.on('closed', () => {
        mainWindow = null
        previewWindow = null
    })

    ipcMain.on('image:preview', (e, index) => {
        previewImage(index)
    })
})

app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})