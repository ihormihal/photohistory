const fs = require('fs')
const path = require('path')
const recursive = require('recursive-readdir')
const sharp = require('sharp')
const utils = require('./utils')


// const SCAN_PATH = '/Volumes/Transcend/MEDIA\ STORY/2007'
const SCAN_PATH = '/Users/admin/Documents'

const findImages = (dirPath) => {
    return new Promise((resolve, reject) => {
        recursive(dirPath, ["!*.{png,gif,jpg,jpeg,JPG,JPEG}"], (err, files) => {
            if(err) {
                reject(err)
                return
            }
            let images = files.map((imagePath) => { 
                return { path: path.relative(SCAN_PATH, imagePath) }
            })
            resolve(images)
        })
    })
}

const imageInfo = (image) => {
    return new Promise((resolve, reject) => {
        const imagePath = path.resolve(SCAN_PATH, image.path)
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

const showProgress = (index, total) => {
    progress = Math.round( (index+1)*100/total )
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(progress + '%');
}

const resize = (image, index, total) => {

    const imagePath = path.resolve(SCAN_PATH, image.path)
    return sharp(imagePath)
        .resize(100)
        .toBuffer()
        .then(data => {
            showProgress(index, total)
            return {
                ...image,
                preview: Buffer.from(data).toString('base64')
            }
        })
}

//sorted array
findImages(SCAN_PATH)
    .then( images => Promise.all( images.map( image => imageInfo(image)) ) )
    .then( images => utils.dateSort( images ) )
    .then( images => Promise.all( images.map( (image, index) => resize(image, index, images.length)) ) )
    .then( images => {

        // console.log(sortImages(images))
        fs.writeFile(path.resolve(SCAN_PATH, 'images.json'), JSON.stringify(images), (err) => {
            if(err) {
                return console.log(err)
            }
            console.log(" The file was saved!")
        })
        
    })
