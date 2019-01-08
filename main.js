const electron = require('electron')
const url = require('url')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const recursive = require('recursive-readdir')

const utils = require('./utils')
// const exif = require('exif-parser')

const { app, BrowserWindow, Menu, dialog } = electron

let mainWindow


const findImages = (path) => {
    return new Promise((resolve, reject) => {
        let images = []
        recursive(path, ["!*.{png,gif,jpg,jpeg,JPG,JPEG}"], (err, files) => {
            if(err) {
                reject(err)
                return
            }
            for(let i=0;i<files.length;i++){
                fs.stat(files[i], (err, info) => {
                    images.push({
                        path: files[i],
                        birthtime: info.birthtime
                    })
                    if(i === files.length-1){
                        resolve(images)
                    }
                })
            }
        })
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
        if(path.length){
            findImages(path[0])
            .then((images) => resizeImages(images))
            .then((images) => {
                console.log(images)
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

app.on('ready', () => {
    mainWindow = new BrowserWindow({})
    mainWindow.loadFile('main.html')
    mainWindow.webContents.openDevTools()

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    setTimeout(() => {
        mainWindow.webContents.send('images:loaded', [{url: '01'}, {url: '02'}])
    }, 3000 )
})