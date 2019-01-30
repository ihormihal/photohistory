const preact = require('preact')
const electron = require('electron')
const utils = require('./utils')
const { h, render, Component } = preact
const { ipcRenderer } = electron

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

const sortImages = (images) => {
    let data = {}
    const offset = new Date().getTimezoneOffset() * 60000
    for(let i=0;i<images.length;i++){
        let dt = new Date(images[i].date.slice(0, -5))
        let year = dt.getFullYear()
        let month = dt.getMonth()
        let day = dt.getDate()

        let m = parseInt(month)+1
        if(m<10) m = '0'+m
        let d = day<10 ? '0'+day : day
        
        if(!data[year]) data[year] = {}
        if(!data[year][m]) data[year][m] = {}
        if(!data[year][m][d]) data[year][m][d] = []
        data[year][m][d].push({
            ...images[i],
            index: i
        })
    }
    
    //sorting
    let output = []
    for(let year in data){
        let yearData = []
        for(month in data[year]){
            let monthData = []
            for(day in data[year][month]){
                monthData.push({
                    title: `${day}.${month}.${year}`,
                    date: day,
                    data: utils.dateSort(data[year][month][day])
                })
            }
            yearData.push({
                title: MONTHS[month],
                date: month,
                data: utils.dateSort(monthData)
            })
        }
        let yearCollection = {
            title: year,
            date: year,
            data: utils.dateSort(yearData)
        }
        output.push(yearCollection)
    }
    return utils.dateSort(output)
}


class Image extends Component {

    render() {
        return (
            h('a', { className: 'image', title: this.props.image.date, onClick: (e) => { this.props.onClick() } }, 
                h('img', {src: 'data:image/png;base64,'+this.props.image.preview})
            )
        )
    }
}

class App extends Component {
    constructor(props){
        super(props)
        this.state = { 
            images: [], 
            fullScreen: false, 
            previewIndex: 0, 
            previewSrc: null
        }
        this.basePath = ''
        this.previewBox = preact.createRef()
    }

    componentDidMount() {
        ipcRenderer.on('images:loaded', (event, images) => {
            this.setState({ images })
        })
        ipcRenderer.on('path:loaded', (event, path) => {
            this.basePath = path
        })
        document.addEventListener('keydown', (e) => {
            if (e.keyCode === 37) {
                this.imagePreviewPrev()
            }
            else if (e.keyCode == 39) {
                this.imagePreviewNext()
            }
        })
        document.addEventListener('webkitfullscreenchange', (e) => {
            this.setState({ fullScreen: !this.state.fullScreen })
        })
    }

    imagePreview(previewIndex){
        this.setState({ previewIndex })
        const previewSrc = this.state.images && previewIndex < this.state.images.length ? this.basePath + this.state.images[previewIndex].path : ''
        this.setState({ previewSrc }, () => {
            if(!this.state.fullScreen) this.previewBox.current.webkitRequestFullscreen()
        })
    }

    imagePreviewPrev() {
        if(this.state.fullScreen){
            const previewIndex = this.state.previewIndex > 0 ? this.state.previewIndex - 1 : this.state.images.length - 1
            this.imagePreview(previewIndex)
        }
    }

    imagePreviewNext() {
        if(this.state.fullScreen){
            const previewIndex = this.state.previewIndex + 1 < this.state.images.length ? this.state.previewIndex + 1 : 0
            this.imagePreview(previewIndex)
        }
    }
    
    render() {
        let sortedImages = this.state.images ? sortImages(this.state.images): null
        return h('div', {className: 'container'},
                h('div', { className: 'page' },
                    sortedImages && sortedImages.map((year) => {
                        return h('div', {className: 'box year-box'},
                            h('h1', null, year.title),
                            year.data.map((month) => {
                                return h('div', null,
                                    h('h2', null, month.title),
                                    h('div', {className: 'box month-box'}, 
                                        month.data.map((day) => {
                                            return h('div', {className: 'box day-box'}, 
                                                h('h2', null, day.title),
                                                h('div', {className: 'images'}, 
                                                    day.data.map((image) => {
                                                        return h(Image, {image, onClick: () => this.imagePreview(image.index)})
                                                    })
                                                )
                                            )
                                        }
                                    ))
                                )
                            })
                        )
                    })
                ),
                h('div', {className: `preview ${this.state.fullScreen ? '' : 'hidden'}`, ref: this.previewBox }, h('img', {src: this.state.previewSrc }) )
            )
    }
}


render(h(App), window.document.body);