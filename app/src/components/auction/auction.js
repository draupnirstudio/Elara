import React from 'react';
import {socket} from "../../utils/socket";
import {EnglishAuctionForm} from "../english-auction/english-auction-form";
import {EnglishAuction, NoAuction} from "../../constants/auction-type";


class Auction extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isAuctionStart: false,
      auctionType: NoAuction,
      currentPrice: 0,
      currentRound: 0,
      money: 0,
      bidMoney: 0
    };
  }
  
  componentDidMount() {
    socket.on('auction-start', (data) => {
      console.log('auction-start', data);
      
      this.setState({
        isAuctionStart: true,
        auctionType: data.auctionType,
        money: data.defaultMoney,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound
      });
    });
    
    socket.on('auction-stop', (data) => {
      console.log('auction stop');
      this.setState({
        isAuctionStart: false,
        auctionType: data.auctionType
      })
    });
    
    socket.on('english-auction-round-start', (data) => {
      console.log('english-auction-round-start', data);
    })
  }
  
  bid() {
    console.log(this.state.bidMoney);
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
        return <EnglishAuctionForm
          bidButtonDidClick={this.bid}
          currentRound={this.state.currentRound}
          currentPrice={this.state.currentPrice}
          money={this.state.money}
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
