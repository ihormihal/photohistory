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

module.exports = { findFiles, fileInfo, updateTime }