const electron = require('electron')
const fs = require('fs')
const path = require('path')
const utils = require('./core/utils')

const { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog, globalShortcut, shell } = electron


let win
let basePath
let jsonPath
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
            jsonPath = selectedPath[0]
            fs.readFile(jsonPath, 'utf8', function(err, contents) {
                imagesData = JSON.parse(contents)
                basePath = path.dirname(jsonPath) + '/'
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
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Toggle shooting time',
                accelerator: process.platform === 'darwin' ? 'Command+Т' : 'Ctrl+Т',
                click() {
                    win.webContents.send('images:toggleDates')
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
            if(basePath && imagesData && typeof ctxImageIndex === 'number' && imagesData[ctxImageIndex] && imagesData[ctxImageIndex].path){
                shell.showItemInFolder(path.resolve(basePath, imagesData[ctxImageIndex].path))
            }
        }
    }))
    ctxImageMenu.append(new MenuItem({
        label: 'Edit time',
        click: () => {
            if(typeof ctxImageIndex === 'number') win.webContents.send('context:editImageDate', ctxImageIndex)
        }
    }))

    ipcMain.on('image:context', (e, data) => {
        ctxImageIndex = data.imageIndex
        ctxImageMenu.popup(win, data.x, data.y)
    })

    ipcMain.on('image:updateDate', (e, data) => {
        let {index, date} = data
        if(basePath && imagesData && imagesData[index] && imagesData[index].path){
            imagesData[index].date = date
            utils.updateTime(imagesData[index], date, basePath).then(() => {
                fs.writeFile(jsonPath, JSON.stringify(imagesData), (err) => {
                    if(err) {
                        return console.log(err)
                    }
                    console.log("The file was updated!")
                })
            }) 
        }
    })

})

app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})