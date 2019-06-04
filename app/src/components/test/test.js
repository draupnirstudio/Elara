import React from "react";
import {socket} from "../../utils/socket";

export class Test extends React.Component {
  componentDidMount() {
  
  }
  
  test() {
    
    socket.on('bid-error', (data) => {
      console.log(data);
    });
    
    socket.emit('bid', {
      bid: 120
    });
    socket.emit('bid', {
      bid: 130
    });
    // socket.emit('bid', {
    //   bid: 125
    // });
    // socket.emit('bid', {
    //   bid: 110
    // });
    // socket.emit('bid', {
    //   bid: 140
    // });
    // socket.emit('bid', {
    //   bid: 110
    // });
    // socket.emit('bid', {
    //   bid: 1050
    // });
    // socket.emit('bid', {
    //   bid: 150
    // });
    // socket.emit('bid', {
    //   bid: 140
    // });
    
  }
  
  render() {
    
    return (
      <button onClick={this.test}>test</button>
    )
  }
}