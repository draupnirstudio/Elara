import React from 'react';

import {socket} from "../../utils/socket";
import {EnglishAuction, NoAuction} from "../../constants/auction-type";

class Admin extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      auctionType: NoAuction
    };
  }
  
  componentDidMount() {
  }
  
  componentWillUnmount() {
  }
  
  startEnglishAuction = () => {
    socket.emit("start-english-auction-admin");
    this.setState({
      auctionType: EnglishAuction
    })
  };
  
  startNewRound() {
    const currentPrice = 10;
    socket.emit("english-auction-start-new-round-admin", {
      currentPrice: 10
    });
  }
  
  stopAuction = () => {
    socket.emit("stop-auction-admin");
    this.setState({
      auctionType: NoAuction
    })
  };
  
  render() {
    return (
      <div>
        <div style={{marginBottom: '10px'}}>
          <button className="ui button" onClick={this.startEnglishAuction}>
            Start English Auction
          </button>
          <button className="ui button" onClick={this.stopAuction}>
            Stop Auction
          </button>
        </div>
        
        <div style={{marginBottom: '10px'}}>
          Auction Status: {this.state.auctionType}
        </div>
        
        <div>
          <table>
            <thead>
            <tr>
              <th>UserId</th>
              <th>Price</th>
              <th>Wallet</th>
              <th>Bid</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>user1</td>
              <td>100</td>
              <td>200</td>
              <td>5</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default Admin;