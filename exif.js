// restore exif data
const utils = require('./core/utils')


const sourceFolder = '/Volumes/Transcend/MEDIA\ STORY/2018/Europe\ RAW/Paris'
const targetFolder = '/Volumes/Transcend/MEDIA\ STORY/2018/Europe/Paris'


const main = async () => {
    const sourceFiles = await utils.findFiles(sourceFolder, "!*.{png,gif,jpg,jpeg,JPG,JPEG,NEF}", true)
    const sourceFilesInfo = await Promise.all(sourceFiles.map(file => utils.fileInfo(file)))
    const targetFiles = await utils.findFiles(targetFolder, "!*.{png,gif,jpg,jpeg,JPG,JPEG}", true)

    for(file of targetFiles){
        let ref = sourceFilesInfo.find((f => f.filename === file.filename))
        if(ref) utils.updateTime(file, ref.date)
    }

}

main()
