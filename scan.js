const fs = require('fs')
const path = require('path')
const recursive = require('recursive-readdir')
const sharp = require('sharp')


const SCAN_PATH = '/Users/admin/Documents/'
const SORT_ASC = true


const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
]


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

const resize = (image) => {
    const imagePath = path.resolve(SCAN_PATH, image.path)
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

const globalSort = (data) => {
    return data.sort((a, b) => SORT_ASC ? a.date - b.date : b.date - a.date)
}

const sortImages = (images) => {
    let data = {}
    for(let i=0;i<images.length;i++){
        let dt = new Date(images[i].date)
        let year = dt.getFullYear()
        let month = dt.getMonth()
        if(!data[year]) data[year] = {}
        if(!data[year][month]) data[year][month] = []
        data[year][month].push({
            ...images[i],
            index: i
        })
    }
    
    let output = []
    for(let year in data){
        let yearData = []
        for(month in data[year]){
            yearData.push({
                title: MONTHS[month],
                date: month,
                data: globalSort(data[year][month])
            })
        }
        let yearCollection = {
            title: year,
            date: year,
            data: globalSort(yearData)
        }
        output.push(yearCollection)
    }
    return globalSort(output)
}

//flat array

// findImages(SCAN_PATH)
//     .then( images => Promise.all( images.map( image => imageInfo(image)) ) )
//     .then( images => Promise.all( images.map( image => resize(image)) ) )
//     .then((images) => {
//         fs.writeFile('index.json', JSON.stringify(images), (err) => {
//             if(err) {
//                 return console.log(err)
//             }
//             console.log("The file was saved!")
//         })
//     })


//sorted array
findImages(SCAN_PATH)
    .then( images => Promise.all( images.map( image => imageInfo(image)) ) )
    .then( images => {
        
        console.log(sortImages(images))
    })
