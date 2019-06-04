import React from 'react';
import {getUserId, socket} from "../../utils/socket";
import {AuctionForm} from "../auction-form/auction-form";
import {EnglishAuction, NoAuction} from "../../constants/auction-type";

class Auction extends React.Component {
  initialState = {
    userId: getUserId(),
    isAuctionStart: false,
    auctionType: NoAuction,
    currentPrice: 0,
    currentRound: 0,
    currentBid: 0,
    money: 0,
    hasBid: false,
    winRound: 0,
  };
  
  constructor(props) {
    super(props);
    
    this.state = this.initialState;
  }
  
  componentDidMount() {
    socket.on('user-connected', (data) => {
      console.log('user connected', data);
      socket.emit('resume-auction');
    });
    
    socket.on('auction-start', (data) => {
      console.log('auction start', data);
      
      this.setState({
        isAuctionStart: true,
        auctionType: data.auctionType,
        money: data.money,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound,
        currentBid: data.currentBid,
        hasBid: false
      });
    });
    
    socket.on('auction-stop', (data) => {
      console.log('auction stop', data);
      
      this.setState(this.initialState);
    });
    
    socket.on('next-round', data => {
      console.log('next round start', data);
      
      this.setState({
        currentPrice: data.currentPrice,
        currentRound: data.currentRound,
        currentBid: data.currentBid,
        hasBid: data.hasBid
      }, () => this.form.reset());
    });
    
    socket.on('resume-auction', (data) => {
      console.log('auction resumed', data);
      
      this.setState({
        isAuctionStart: data.isAuctionStart,
        auctionType: data.auctionType,
        money: data.money,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound,
        hasBid: data.hasBid,
        currentBid: data.currentBid,
        winRound: data.winRound
      });
    });
    
    socket.on('bid-successful', (data) => {
      console.log('bid successful', data);
      this.setState({
        money: data.money,
        currentBid: data.currentBid,
        hasBid: data.hasBid
      });
    });
    
    socket.on('bid-error', (data) => {
      console.error('bid error', data);
      
      alert('bid error, please try again')
    });
    
    socket.on('current-price-updated', (data) => {
      console.log('current price updated', data);
      
      this.setState({currentPrice: data.currentPrice});
    });
    
    socket.on('default-money-changed', (data) => {
      console.log('default money changed', data);
      
      if (this.state.currentRound === 0) {
        this.setState({money: data.defaultMoney});
      }
    });
    
    socket.on('win-rounds-did-update', (data) => {
      console.log('win round did update', data);
      this.setState({winRound: data[this.state.userId] || 0});
    });
    
  }
  
  bid(price) {
    socket.emit('bid', {bid: price});
  }
  
  render() {
    const isAuctionStart = this.state.isAuctionStart;
    
    if (!isAuctionStart) {
      return (
        <div style={{textAlign: "center"}}>
          <p>Welcome to Auction System</p>
          <p>Please wait for auction begins...</p>
        </div>
      );
    }
    
    switch (this.state.auctionType) {
      case EnglishAuction: {
        return <AuctionForm
          ref={(child) => {
            this.form = child;
          }}
          bidButtonDidClick={this.bid}
          currentRound={this.state.currentRound}
          currentPrice={this.state.currentPrice}
          money={this.state.money}
          currentBid={this.state.currentBid}
          hasBid={this.state.hasBid}
          userId={this.state.userId}
          winRound={this.state.winRound}
        />;
      }
      default: {
        return (
          <div>auction not handled</div>
        )
      }
    }
  }
}

export default Auction;
