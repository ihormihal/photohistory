// restore exif data
const utils = require('./core/utils')



const main = async (sourceFolder, targetFolder) => {
    const sourceFiles = await utils.findFiles(sourceFolder, "!*.{png,gif,jpg,jpeg,JPG,JPEG,NEF}", true)
    const sourceFilesInfo = await Promise.all(sourceFiles.map(file => utils.fileInfo(file)))
    const targetFiles = await utils.findFiles(targetFolder, "!*.{png,gif,jpg,jpeg,JPG,JPEG}", true)

    for(file of targetFiles){
        let ref = sourceFilesInfo.find((f => f.filename === file.filename))
        if(ref) utils.updateTime(file, ref.date)
    }

}

main(
    "f:/MEDIA STORY/2013/UAE-December/100D5100/RAW",
    "f:/MEDIA STORY/2013/UAE-December/100D5100/DIST",
)
