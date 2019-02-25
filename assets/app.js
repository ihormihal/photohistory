const preact = require('preact')
const electron = require('electron')
const { h, render, Component } = preact
const { ipcRenderer } = electron
const { MONTHS } = require('./assets/constants')

const formatDate = (date, pattern) => {
    date = new Date(date)
    let YYYY = date.getFullYear()
    let MM = date.getMonth()+1
    if(MM < 10) MM = '0'+MM
    let DD = date.getDate()
    if(DD < 10) DD = '0'+DD
    let hh = date.getHours()
    if(hh < 10) hh = '0'+hh
    let mm = date.getMinutes()
    if(mm < 10) mm = '0'+mm
    let ss = date.getSeconds()
    if(ss < 10) ss = '0'+ss

    let dt = pattern.replace('YYYY',YYYY)
    dt = dt.replace('MM',MM)
    dt = dt.replace('DD',DD)
    dt = dt.replace('hh',hh)
    dt = dt.replace('mm',mm)
    dt = dt.replace('ss',ss)
    
    return dt
}

const formatTime = (date) => {
    date = new Date(date)
    let hh = date.getHours()
    let mm = date.getHours()
    return `${hh}:${mm}`
}

const sort = (data) => {
    return data.sort((a, b) => {
        if (a.date > b.date) return -1
        if (a.date < b.date) return 1
    })
}

const timezoneOffset = -7200000
const sortImages = (images) => {
    let data = {}
    for(let i=0;i<images.length;i++){
        let dt = new Date(images[i].date).getTime() + timezoneOffset
        let date = new Date(dt)
        images[i].fdate = date
        let year = formatDate(date, "YYYY")
        let month = formatDate(date, "MM")
        let day = formatDate(date, "DD")

        if(!data[year]) data[year] = {}
        if(!data[year][month]) data[year][month] = {}
        if(!data[year][month][day]) data[year][month][day] = []
        data[year][month][day].push({
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
                    data: sort(data[year][month][day])
                })
            }
            yearData.push({
                title: MONTHS[month],
                date: month,
                data: sort(monthData)
            })
        }
        let yearCollection = {
            title: year,
            date: year,
            data: sort(yearData)
        }
        output.push(yearCollection)
    }
    return sort(output)
}

class Popup extends Component {

    constructor(props){
        super(props)
        this.state = {}
    }

    open(){
        this.setState({
            date: formatDate(this.props.image.date, "YYYY-MM-DD"),
            time: formatDate(this.props.image.date, "hh:mm")
        })
        this.setState({isOpen: true})
    }

    close(){
        this.setState({isOpen: false})
    }

    popupClick(e){
        e.stopPropagation()
    }

    setDate(date){
        this.setState({date})
    }

    setTime(time){
        this.setState({time})
    }

    submit(e){
        e.preventDefault()
        if(this.state.date && this.state.time){
            let date = new Date(`${this.state.date}T${this.state.time}`)
            // let dt = new Date(date.getTime() + new Date().getTimezoneOffset()*60000)
            this.props.setDate(date, this.props.image.index)
            this.close()
        }
    }
    
    render() {
        if(this.state.isOpen){
            return h('div', { className: 'popup-wrapper', onClick: (e) => this.close(e) },
                h('div', { className: 'popup', onClick: (e) => this.popupClick(e) },
                    h('div', { className: 'popup-header' },
                        'Edit shooting time',
                        h('div', { className: 'close', onClick: (e) => this.close(e) }),
                    ),
                    h('div', { className: 'popup-content' },
                        h('div', null,
                            h('div', { className: 'inline-group'},
                                h('div', { className: 'form-group'},
                                    h('label', null, 'Date'),
                                    h('input', { type: 'date', value: this.state.date, name: 'date', onBlur: (e) => this.setDate(e.target.value), onClick: (e) => this.setDate(e.target.value) }),
                                ),
                                h('div', { className: 'form-group'},
                                    h('label', null, 'Time'),
                                    h('input', { type: 'time', value: this.state.time, name: 'time', onBlur: (e) => this.setTime(e.target.value), onClick: (e) => this.setTime(e.target.value) })
                                )
                            ),
                            
                        )
                    ),
                    h('div', { className: 'popup-footer' },
                        h('button', { type: 'submit', onClick: (e) => this.submit(e)}, 'OK')
                    )
                )
            )
        }else{
            return false
        }
    }
}


class Image extends Component {

    render() {
        let date = new Date(this.props.image.date)
        return (
            h('a', { 
                    className: 'image', 
                    title: this.props.image.date, 
                    onClick: (e) => this.props.onClick(), 
                    onContextMenu: (e) => this.props.onContext(e, this.props.image.index) 
                }, 
                h('img', {src: 'data:image/png;base64,'+this.props.image.preview}),
                h('span', { className: 'date' }, formatDate(this.props.image.fdate, "DD.MM.YYYY hh:mm")),
                h('span', { className: 'name' }, this.props.image.filename)
            )
        )
    }
}

class App extends Component {
    constructor(props){
        super(props)
        this.state = { 
            images: [], 
            currentImage: null,
            fullScreen: false, 
            previewIndex: 0, 
            previewSrc: null,
            popupIsOpen: false,
            showDates: false
        }
        this.popup = false
        this.basePath = ''
        this.previewBox = preact.createRef()
    }

    componentDidMount() {
        ipcRenderer.on('images:loaded', (event, images) => {
            this.setState({ images })
        })
        ipcRenderer.on('path:loaded', (event, basePath) => {
            this.basePath = basePath
        })
        ipcRenderer.on('images:toggleDates', (event) => {
            this.setState({ showDates: !this.state.showDates })
        })
        ipcRenderer.on('context:editImageDate', (event, index) => {
            if(this.state.images[index]){
                this.setState({currentImage: {
                    index,
                    ...this.state.images[index]
                }}, () => {
                    this.popup.open()
                })
            }
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

    imageContext(e, i) {
        ipcRenderer.send('image:context', {
            x: e.clientX, 
            y: e.clientY,
            imageIndex: i
        })
    }

    setDate(date, index){
        ipcRenderer.send('image:updateDate', {
            index, 
            date
        })
        this.state.images[index].date = date.toISOString()
        this.forceUpdate()
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
                                                h('div', {className: `images ${this.state.showDates ? 'show-dates' : ''}`}, 
                                                    day.data.map((image) => {
                                                        return h(Image, {image, onClick: () => this.imagePreview(image.index), onContext: (e, i) => this.imageContext(e, i)})
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
                h('div', {className: `preview ${this.state.fullScreen ? '' : 'hidden'}`, ref: this.previewBox }, h('img', {src: this.state.previewSrc }) ),
                h(Popup, { ref: popup => this.popup = popup, image: this.state.currentImage, setDate: (date, index) => this.setDate(date, index) })
            )
    }
}


render(h(App), window.document.body);