const preact = require('preact')
const electron = require('electron')
const { h, render, Component } = preact
const { ipcRenderer } = electron

class App extends Component {
    constructor() {
        super()
        this.state = { images: [] }
        ipcRenderer.on('images:loaded', (event, images) => {
            console.log('render images', images)
            this.setState({ images: images })
        })
    }
    
    render(props, state) {
        return h('pre',{}, JSON.stringify(this.state.images))
    }
}

// render an instance of Clock into <body>:
render(h(App), window.document.body);