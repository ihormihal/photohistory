const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const utils = require('./core/utils')

const sort = (data) => {
    return data.sort((a, b) => {
        if (a.date > b.date) return -1
        if (a.date < b.date) return 1
    })
}

const showProgress = (i, total) => {
    progress = Math.ceil( i*100/total )
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`${i}/${total} -> ${progress}%`);
}

let counter = 0
const resize = (scanPath, image, total) => {
    const imagePath = path.resolve(scanPath, image.path)
    console.log(imagePath)
    return sharp(imagePath)
        .resize(100)
        .toBuffer()
        .then(data => {
            counter++
            showProgress(counter, total)
            return {
                ...image,
                preview: Buffer.from(data).toString('base64')
            }
        })
}

const scan = (scanPath) => {
    const indexFilePath = path.resolve(scanPath, 'images.json')
    counter = 0
    utils.findFiles(scanPath, '!*.{png,gif,jpg,jpeg,JPG,JPEG}')
        .then( images => Promise.all( images.map( image => utils.fileInfo(image, scanPath)) ) )
        .then( images => sort( images ) )
        .then( images => Promise.all( images.map( (image, index) => resize(scanPath, image, images.length)) ) )
        .then( images => {
            fs.writeFile(indexFilePath, JSON.stringify(images), (err) => {
                if(err) {
                    return console.log(err)
                }
                console.log(" The file was saved!")
            })
            
        })
}

// /Users/admin/Documents
// /Volumes/Transcend/MEDIA\ STORY/2009
scan('/Users/ihormihal/Pictures')
