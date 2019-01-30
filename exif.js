// restore exif data

const fs = require('fs')
const path = require('path')
const recursive = require('recursive-readdir')

const sourceFolder = '/Volumes/Transcend/MEDIA\ STORY/2018/Europe\ RAW/Amsterdam'
const targetFolder = '/Volumes/Transcend/MEDIA\ STORY/2018/Europe/Amsterdam'


const findFiles = (dirPath) => {
    return new Promise((resolve, reject) => {
        recursive(dirPath, ["!*.{png,gif,jpg,jpeg,JPG,JPEG,NEF}"], (err, files) => {
            if(err) {
                reject(err)
                return
            }
            let output = files.map((filePath) => { 
                return { 
                    filename: path.parse(filePath).name,
                    path: filePath 
                }
            })
            resolve(output)
        })
    })
}

const fileInfo = (file) => {
    return new Promise((resolve, reject) => {
        fs.stat(file.path, (err, info) => {
            if(err) {
                reject(err)
                return
            }
            resolve({
                ...file,
                date: info.birthtime > info.mtime ? info.mtime : info.birthtime
            })
        })
    })
}

const updateTime = (file, date) => {
    return new Promise((resolve, reject) => {
        console.log(`${file.path} -> ${date}`)
        fs.utimes(file.path, date, date, (err, info) => {
            if(err) {
                reject(err)
                return
            }
            console.log(`${file.filename} -> ${date}`)
            resolve()
        })
    })
}

const main = async () => {
    const sourceFiles = await findFiles(sourceFolder)
    const sourceFilesInfo = await Promise.all(sourceFiles.map(file => fileInfo(file)))
    const targetFiles = await findFiles(targetFolder)

    for(file of targetFiles){
        let ref = sourceFilesInfo.find((file => file.filename === file.filename))
        updateTime(file, ref.date)
    }

}

main()
