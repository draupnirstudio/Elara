import React from 'react';

import {socket} from "../../utils/socket";

class EnglishAuction extends React.Component {
  constructor(props) {
    super(props);
  
    this.state = {
      response: false,
    };
  }
  
  componentDidMount() {
    // socket.emit("hello", "world");
  }
  
  render() {
    return (
      <div style={{textAlign: "center"}}>
        <p>Please wait for auction begins...</p>
      </div>
    );
  }
}

export default EnglishAuction;