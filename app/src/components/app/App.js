import React from 'react';
import './App.css';
import socketClient from "socket.io-client";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            response: false,
            endpoint: "http://localhost/"
        };
    }

    componentDidMount() {
        const {endpoint} = this.state;
        console.log(endpoint);
        const socket = socketClient(endpoint, {path: '/socket'});
        socket.on("FromAPI", data => this.setState({response: data}));
    }

    render() {
        const {response} = this.state;

        return (
            <div style={{textAlign: "center"}}>
                {response
                    ? <p>
                      {response}
                    </p>
                    : <p>Loading...</p>}
            </div>
        );
    }
}

export default App;
