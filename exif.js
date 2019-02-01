// restore exif data
const utils = require('./core/utils')



const main = (sourceFolder, targetFolder) => {
    const sourceFiles = await utils.findFiles(sourceFolder, "!*.{png,gif,jpg,jpeg,JPG,JPEG,NEF}", true)
    const sourceFilesInfo = await Promise.all(sourceFiles.map(file => utils.fileInfo(file)))
    const targetFiles = await utils.findFiles(targetFolder, "!*.{png,gif,jpg,jpeg,JPG,JPEG}", true)

    for(file of targetFiles){
        let ref = sourceFilesInfo.find((f => f.filename === file.filename))
        if(ref) utils.updateTime(file, ref.date)
    }

}

main(
    '/Volumes/Transcend/MEDIA\ STORY/2018/Europe\ RAW/Paris',
    '/Volumes/Transcend/MEDIA\ STORY/2018/Europe/Paris'
)
