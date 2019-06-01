import {AuctionType} from './auction-type';
import {Server, Socket} from 'socket.io';
import {User} from './user';
import _ = require('lodash');

class Auction {
  isAuctionStarted = false;
  auctionType: AuctionType = AuctionType.NoAuction;
  currentRound = 0;
  currentPrice = 0;
  defaultMoney = 1000;
  priceList: number[] = [77.6005722, 82.49552303, 86.55877974, 82.41900139, 60.3182416, 56.16922002, 67.31837755, 55.19294244, 80.16425166, 82.18311577, 60.49431266, 69.28826512, 65.61803702, 66.46525487, 81.03760442, 51.35115743, 64.56088878, 79.56828498, 97.04283086, 64.63490765, 79.0280886, 56.0338786, 79.714225, 82.89652694, 46.70962404, 82.25331049, 67.18794555, 52.92877959, 53.41817901, 64.61678833, 86.59124757, 81.51014393, 75.21162171, 80.83279466, 58.52799935];
  users: User[] = [];
  
  startAllAuction(io: Server, socket: Socket, auctionType: AuctionType) {
    this.isAuctionStarted = true;
    this.auctionType = auctionType;
    this.currentRound = 1;
    this.currentPrice = auction.priceList[this.currentRound];
    
    io.sockets.emit('auction-start', {
      auctionType: this.auctionType,
      money: this.defaultMoney,
      currentRound: this.currentRound,
      currentPrice: this.currentPrice
    });
    
    // TODO: array out-range error
    socket.emit('next-round-price-admin', {
      nextPrice: this.priceList[this.currentRound + 1]
    });
  }
  
  startNextRound(socket: Socket) {
    this.currentRound += 1;
    this.currentPrice = auction.priceList[this.currentRound];
    
    socket.broadcast.emit('next-round', {
      currentRound: this.currentRound,
      currentPrice: this.currentPrice
    });
    
    socket.emit('next-round-admin', {
      currentRound: this.currentRound,
      currentPrice: this.currentPrice
    });
    
    socket.emit('next-round-price-admin', {
      nextPrice: this.priceList[this.currentRound + 1]
    });
  }
  
  resumeAuction(socket: Socket, userId: string) {
    let user: User = _.findLast(this.users, user => user.userId === userId) as any;
    
    if(_.isNil(user)) {
      user = new User(userId, this.defaultMoney);
      this.users.push(user);
    }
  
    console.log(this.users);
    
    if (!this.isAuctionStarted) {
      this.stopAuction(socket);
      return;
    }
  
    socket.emit('resume-auction', {
      auctionType: this.auctionType,
      money: user.money, // TODO: restore saved money
      currentRound: this.currentRound,
      currentPrice: this.currentPrice
    });
  
    socket.emit('next-round-price-admin', {
      nextPrice: this.priceList[this.currentRound + 1]
    });
  }
  
  stopAuction(socket: Socket) {
    this.isAuctionStarted = false;
    this.auctionType = AuctionType.NoAuction;
    
    socket.emit('auction-stop', {
      auctionType: this.auctionType
    });
  }
  
  stopAllAuction(io: Server) {
    this.isAuctionStarted = false;
    this.auctionType = AuctionType.NoAuction;
    
    io.sockets && io.sockets.emit('auction-stop', {
      auctionType: this.auctionType
    });
  }
  
  
}

export const auction = new Auction();

