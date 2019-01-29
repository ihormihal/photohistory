const fs = require('fs')
const path = require('path')
const recursive = require('recursive-readdir')
const sharp = require('sharp')


const scanPath = '/Users/admin/Music/'

const findImages = (dirPath) => {
    return new Promise((resolve, reject) => {
        recursive(dirPath, ["!*.{png,gif,jpg,jpeg,JPG,JPEG}"], (err, files) => {
            if(err) {
                reject(err)
                return
            }
            let images = files.map((imagePath) => { 
                return { path: path.relative(scanPath, imagePath) }
            })
            resolve(images)
        })
    })
}

const imageInfo = (image) => {
    return new Promise((resolve, reject) => {
        const imagePath = path.resolve(scanPath, image.path)
        fs.stat(imagePath, (err, info) => {
            if(err) {
                reject(err)
                return
            }
            resolve({
                ...image,
                date: info.birthtime > info.mtime ? info.mtime : info.birthtime
            })
        })
    })
}

const resize = (image) => {
    const imagePath = path.resolve(scanPath, image.path)
    return sharp(imagePath)
        .resize(100)
        .toBuffer()
        .then(data => {
            return {
                ...image,
                preview: Buffer.from(data).toString('base64')
            }
        })
}


findImages(scanPath)
    .then( images => Promise.all( images.map( image => imageInfo(image)) ) )
    .then( images => Promise.all( images.map( image => resize(image)) ) )
    .then((images) => {
        fs.writeFile('index.json', JSON.stringify(images), (err) => {
            if(err) {
                return console.log(err)
            }
            console.log("The file was saved!")
        })
    })