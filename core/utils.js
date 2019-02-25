const fs = require('fs')
const path = require('path')
const recursive = require('recursive-readdir')

const findFiles = (dirPath, pattern, isAbsolutePath) => {
    return new Promise((resolve, reject) => {
        recursive(dirPath, [pattern], (err, files) => {
            if(err) {
                reject(err)
                return
            }
            let output = files.map((filePath) => { 
                return { 
                    filename: path.parse(filePath).name,
                    path: isAbsolutePath ? filePath : path.relative(dirPath, filePath)
                }
            })
            resolve(output)
        })
    })
}

const fileInfo = (file, basePath) => {
    return new Promise((resolve, reject) => {
        let filePath = basePath ? path.resolve(basePath, file.path) : file.path
        fs.stat(filePath, (err, info) => {
            if(err) {
                reject(err)
                return
            }
            let date = new Date(Math.min(info.atimeMs, info.mtimeMs, info.ctimeMs, info.birthtimeMs))
            resolve({
                ...file,
                date
            })
        })
    })
}

const updateTime = (file, date, basePath) => {
    date = new Date(date)
    let filePath = basePath ? path.resolve(basePath, file.path) : file.path
    return new Promise((resolve, reject) => {
        fs.utimes(filePath, date, date, (err, info) => {
            if(err) {
                reject(err)
                return
            }
            console.log(`${file.filename} -> ${date}`)
            resolve()
        })
    })
}

module.exports = { findFiles, fileInfo, updateTime }