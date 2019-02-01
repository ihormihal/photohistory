const electron = require('electron')
const fs = require('fs')
const path = require('path')

const { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog, globalShortcut, shell } = electron


let win
let basePath
let imagesData

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
        defaultPath: '/Volumes/Transcend/MEDIA\ STORY/2018/Europe/Amsterdam', //app.getPath('documents'),
        properties: ['openFile'],
        filters: [
            { name: 'JSON', extensions: ['json'] } 
        ]
    }, (selectedPath) => {
        if(selectedPath && selectedPath.length){
            fs.readFile(selectedPath[0], 'utf8', function(err, contents) {
                imagesData = JSON.parse(contents)
                basePath = path.dirname(selectedPath[0]) + '/'
                win.webContents.send('path:loaded', basePath)
                win.webContents.send('images:loaded', imagesData)
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
    win = new BrowserWindow({})
    win.loadFile('main.html')
    // win.webContents.openDevTools()

    win.on('closed', () => {
        win = null
        previewWindow = null
    })

    //image context menu
    const ctxImageMenu = new Menu()
    let ctxImageIndex
    ctxImageMenu.append(new MenuItem({
        label: 'Reveal in Finder',
        click: () => {
            if(basePath && imagesData && imagesData[ctxImageIndex] && imagesData[ctxImageIndex].path){
                shell.showItemInFolder(path.resolve(basePath, imagesData[ctxImageIndex].path))
            }
        }
    }))
    ctxImageMenu.append(new MenuItem({
        label: 'Edit time',
        click: () => {
            if(ctxImageIndex) win.webContents.send('popup:editImageDate', ctxImageIndex)
        }
    }))

    ipcMain.on('image:context', (e, data) => {
        ctxImageIndex = data.imageIndex
        ctxImageMenu.popup(win, data.x, data.y)
    })

})

app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})