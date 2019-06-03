import React from 'react';

import {getUserId, socket} from "../../utils/socket";
import {NoAuction} from "../../constants/auction-type";

import './admin.css';

const UnknownError = 1000;
// const BidUserNotFound = 1001;
// const UserAlreadyBid = 1002;
// const BidShouldLargerThanCurrentPrice = 1003;
// const BidShouldLessOrEqualThanRemainMoney = 1004;

class Admin extends React.Component {
  
  initialState = {
    auctionType: NoAuction,
    isAuctionStart: false,
    currentPrice: 0,
    currentRound: 0,
    defaultMoney: 0,
    nextPrice: 0,
    userBidHistory: [],
    isWaitingAuctionStart: false,
  };
  
  constructor(props) {
    super(props);
    
    this.state = this.initialState;
  }
  
  componentDidMount() {
    socket.emit('admin-user-registered', {
      userId: getUserId()
    });
    
    socket.on('user-connected', (data) => {
      console.log('user connected', data);
      socket.emit('resume-auction-admin');
    });
    
    socket.on('auction-start', (data) => {
      console.log('auction start', data);
      
      this.setState({isWaitingAuctionStart: false});
      
      this.setState({
        isAuctionStart: true,
        auctionType: data.auctionType,
        defaultMoney: data.money,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound
      });
    });
    
    socket.on('auction-start-error', (data) => {
      console.log('auction start error', data);
      switch (data.code) {
        case UnknownError:
          alert("start auction error, please try again");
          break;
        default:
          break;
      }
    });
    
    socket.on('auction-stop', (data) => {
      console.log('auction stop', data);
      this.setState(this.initialState);
    });
    
    socket.on('next-round', data => {
      console.log('next round', data);
      this.setState({
        currentPrice: data.currentPrice,
        currentRound: data.currentRound
      })
    });
    
    socket.on('resume-auction', (data) => {
      console.log('auction resumed', data);
      
      this.setState({
        isAuctionStart: data.isAuctionStart,
        auctionType: data.auctionType,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound,
        defaultMoney: data.defaultMoney
      });
    });
    
    socket.on('next-round-price-admin', (data) => {
      console.log('next price: ', data);
      this.setState({nextPrice: data.nextPrice});
    });
    
    socket.on('user-did-bid', (data) => {
      console.log('user did bid', data);
      this.setState({userBidHistory: [...this.state.userBidHistory, data]});
    });
    
    socket.on('default-money-changed', (data) => {
      console.log('default money changed', data);
      alert(`default money changed to ${data.defaultMoney}`);
    });
    
    socket.on('bid-history-fetched', (data) => {
      console.log('bid-history-fetched', data);
      this.setState({userBidHistory: [...data]});
    });
  }
  
  startEnglishAuction = () => {
    this.setState({isWaitingAuctionStart: true});
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
    const UserBidHistory = this.state.userBidHistory.map((e) =>
      <tr key={`${e.user}-${e.round}`}>
        <td>{e.user}</td>
        <td>{e.round}</td>
        <td>{e.price}</td>
        <td>{e.startMoney}</td>
        <td>{e.bid}</td>
        <td>{e.remainMoney}</td>
      </tr>
    );
    
    return (
      <div>
        <div className="item-wrapper">
          <button className="ui button" disabled={this.state.isAuctionStart || this.state.isWaitingAuctionStart}
                  onClick={this.startEnglishAuction}>
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
              value={this.state.defaultMoney || 0}
              onChange={this.defaultMoneyDidChange}
            />
          </div>
          <button
            className="ui button"
            disabled={!this.state.isAuctionStart}
            onClick={this.setDefaultMoney}>
            update
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
              value={this.state.nextPrice || 0}
              onChange={this.nextPriceDidChange}
            />
          </div>
        </div>
        
        <div className="item-wrapper"
             style={{display: this.state.isAuctionStart ? 'block' : 'none'}}>
          <table className="ui celled table text-center">
            <thead>
            <tr>
              <th>userId</th>
              <th>round</th>
              <th>price</th>
              <th>startMoney</th>
              <th>bid</th>
              <th>remainMoney</th>
            </tr>
            </thead>
            <tbody>
            {UserBidHistory}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default Admin;