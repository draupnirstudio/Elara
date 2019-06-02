import React from 'react';

import {socket} from "../../utils/socket";
import {NoAuction} from "../../constants/auction-type";

import './admin.css';

const UnknownError = 1000;
// const BidUserNotFound = 1001;
// const UserAlreadyBid = 1002;
// const BidShouldLargerThanCurrentPrice = 1003;
// const BidShouldLessOrEqualThanRemainMoney = 1004;

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
    socket.on('auction-start', (data) => {
      console.log('auction-start', data);
      
      this.setState({
        isAuctionStart: true,
        auctionType: data.auctionType,
        defaultMoney: data.money,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound
      });
    });
    
    socket.on('auction-start-error', (data) => {
      console.log(data);
      switch (data.code) {
        case UnknownError:
          alert("start auction error, please try again");
          break;
        default:
          break;
      }
    });
    
    socket.on('auction-stop', (data) => {
      console.log('auction stop');
      this.setState({
        isAuctionStart: false,
        auctionType: data.auctionType,
        currentPrice: 0,
        currentRound: 0,
        nextPrice: 0,
        defaultMoney: 0
      })
    });
    
    socket.on('next-round', data => {
      console.log('next round', data);
      this.setState({
        currentPrice: data.currentPrice,
        currentRound: data.currentRound
      })
    });
    
    socket.on('resume-auction', (data) => {
      console.log('auction-resumed', data);
      
      this.setState({
        isAuctionStart: true,
        auctionType: data.auctionType,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound,
        defaultMoney: data.money
      });
    });
    
    socket.on('next-round-price-admin', (data) => {
      this.setState({
        nextPrice: data.nextPrice
      })
    });
  }
  
  startEnglishAuction = () => {
    socket.emit("start-english-auction-admin");
  };
  
  startNextRound = () => {
    socket.emit("start-next-round-admin", {
      nextPrice: this.state.nextPrice
    });
  };
  
  stopAuction = () => {
    socket.emit("stop-auction-admin");
    this.setState({
      auctionType: NoAuction
    })
  };
  
  
  nextPriceDidChange = (event) => {
    this.setState({nextPrice: event.target.value});
  };
  
  setDefaultMoney = () => {
    socket.emit("set-default-money-admin", {
      defaultMoney: this.state.defaultMoney
    });
  };
  
  defaultMoneyDidChange = (event) => {
    this.setState({defaultMoney: event.target.value});
  };
  
  
  render() {
    return (
      <div>
        <div className="item-wrapper">
          <button className="ui button" disabled={this.state.isAuctionStart} onClick={this.startEnglishAuction}>
            Start English Auction
          </button>
          <button className="ui button" disabled={!this.state.isAuctionStart} onClick={this.stopAuction}>
            Stop Auction
          </button>
        </div>
        
        <div className="item-wrapper">
          <button className="ui button" disabled={!this.state.isAuctionStart} onClick={this.startNextRound}>
            Start Next Round
          </button>
        </div>
        
        <div className="item-wrapper">
          <span>auction status: </span> {this.state.auctionType}
        </div>
        
        <div className="item-wrapper">
          <span>default money:</span>
          <div className="ui input">
            <input
              type="text"
              disabled={!this.state.isAuctionStart}
              value={this.state.defaultMoney}
              onChange={this.defaultMoneyDidChange}
            />
          </div>
          <button
            className="ui button"
            disabled={!this.state.isAuctionStart}
            onClick={this.setDefaultMoney}>
            submit
          </button>
        </div>
        
        <div className="item-wrapper">
          <span>current round: </span> {this.state.currentRound}
        </div>
        
        <div className="item-wrapper">
          <span>current price: </span>{this.state.currentPrice}
        </div>
        
        <div className="item-wrapper">
          <span>next price:</span>
          <div className="ui input">
            <input
              type="number"
              disabled={!this.state.isAuctionStart}
              value={this.state.nextPrice}
              onChange={this.nextPriceDidChange}
            />
          </div>
        </div>
      
      
      </div>
    );
  }
}

export default Admin;