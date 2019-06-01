import React from 'react';

import {socket} from "../../utils/socket";
import {EnglishAuction, NoAuction} from "../../constants/auction-type";

class Admin extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      auctionType: NoAuction,
      isAuctionStart: false,
      currentPrice: 0,
      currentRound: 0,
      defaultMoney: 0,
      nextPrice: 0,
    };
  }
  
  componentDidMount() {
    socket.on('next-round-price-admin', (data) => {
      this.setState({
        nextPrice: data.nextPrice
      })
    });
  
  
    socket.on('auction-start-admin', (data) => {
      console.log('auction-start', data);
    
      this.setState({
        isAuctionStart: true,
        auctionType: data.auctionType,
        defaultMoney: data.defaultMoney,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound
      });
    });
  
    socket.on('auction-stop-admin', (data) => {
      console.log('auction stop');
      this.setState({
        isAuctionStart: false,
        auctionType: data.auctionType,
        currentPrice: 0,
        currentRound: 0,
        nextPrice: 0
      })
    });
    
  }
  
  componentWillUnmount() {
  }
  
  startEnglishAuction = () => {
    socket.emit("start-english-auction-admin");
    this.setState({
      auctionType: EnglishAuction
    })
  };
  
  startNextRound() {
    socket.emit("start-next-round-admin");
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
          <button className="ui button" disabled={this.state.isAuctionStart} onClick={this.startEnglishAuction}>
            Start English Auction
          </button>
          <button className="ui button" disabled={!this.state.isAuctionStart} onClick={this.startNextRound}>
            Stop Auction
          </button>
        </div>
        
        <div>
          <button className="ui button" disabled={!this.state.isAuctionStart} onClick={this.startEnglishAuction}>
            Start Next Round
          </button>
        </div>
        
        <div style={{marginBottom: '10px'}}>
          Auction Status: {this.state.auctionType}
        </div>
        
        <div style={{marginBottom: '10px'}}>
          current round: {this.state.currentRound}
        </div>
  
        <div style={{marginBottom: '10px'}}>
          current price: {this.state.currentPrice}
        </div>
        
        <div style={{marginBottom: '10px'}}>
          next price: <input type="text" value={this.state.nextPrice}/>
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