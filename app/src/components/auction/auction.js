import React from 'react';
import {socket} from "../../utils/socket";
import {AuctionForm} from "../auction-form/auction-form";
import {EnglishAuction, NoAuction} from "../../constants/auction-type";


class Auction extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isAuctionStart: false,
      auctionType: NoAuction,
      currentPrice: 0,
      currentRound: 0,
      currentBid: 0,
      money: 0,
      hasBid: false
    };
  }
  
  componentDidMount() {
    socket.on('auction-start', (data) => {
      console.log('auction-start', data);
      
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
      console.log('auction stop');
      this.setState({
        isAuctionStart: false,
        auctionType: data.auctionType,
        hasBid: false
      })
    });
    
    socket.on('next-round', data => {
      console.log('next round', data);
      this.setState({
        currentPrice: data.currentPrice,
        currentRound: data.currentRound,
        currentBid: data.currentBid,
        hasBid: data.hasBid
      }, () => this.form.reset());
      
    });
    
    socket.on('resume-auction', (data) => {
      console.log('auction-resumed', data);
      
      this.setState({
        isAuctionStart: true,
        auctionType: data.auctionType,
        money: data.money,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound,
        hasBid: data.hasBid,
        currentBid: data.currentBid
      });
    });
    
    socket.on('bid-successful', (data) => {
      this.setState({
        money: data.money,
        currentBid: data.currentBid,
        hasBid: data.hasBid
      })
    });
    
    socket.on('current-price-updated', (data) => {
      this.setState({
        currentPrice: data.currentPrice
      });
    });
    
  }
  
  bid(price) {
    socket.emit('bid', {
      bid: price
    });
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
