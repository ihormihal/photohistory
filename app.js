const preact = require('preact')
const electron = require('electron')
const { h, render, Component } = preact
const { ipcRenderer } = electron

const CONFIG = {
    SORT_ASC: false,
}

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

const globalSort = (data) => {
    return data.sort((a, b) => CONFIG.SORT_ASC ? a.date - b.date : b.date - a.date)
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

class Image extends Component {

    handleClick(index) {
        console.log('handleClick', index)
        ipcRenderer.send('image:preview', index)
    }

    render() {
        return (
            h('a', { className: 'image', title: this.props.image.date, onClick: () => { this.handleClick(this.props.image.index) } }, 
                h('img', {src: this.props.image.path})
            )
        )
    }
}

class App extends Component {
    constructor() {
        super()
        ipcRenderer.on('images:loaded', (event, images) => {
            this.setState({ images: sortImages(images) })
        })
    }
    
    render() {
        return (
            h('div', { className: 'images' },
                this.state.images && this.state.images.map((year) => {
                    return (
                        h('div', {className: 'year-box'},
                            h('h1', null, year.title),
                            year.data.map((month) => {
                                return h('div', null,
                                    h('h2', null, month.title),
                                    h('div', {className: 'month-box'}, 
                                        month.data.map((image) => {
                                            return h(Image, {image})
                                        }
                                    ))
                                )
                            })
                        )
                    )
                })
            )
        )
    }
}



// render an instance of Clock into <body>:
render(h(App), window.document.body);