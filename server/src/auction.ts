import {AuctionType} from './auction-type';
import {Server, Socket} from 'socket.io';
import {User} from './user';
import {generateAuctionId} from './helpers/auction-id-generator';

import {query} from './lib/mysql-connector';
import {AuctionPriceGeneratorAlgorithm, generateAuctionPrice} from './helpers/auction-price-generator';
import _ = require('lodash');

class Auction {
  isAuctionStarted = false;
  
  auctionType: AuctionType = AuctionType.NoAuction;
  auctionId: string;
  currentRound = 0;
  currentPrice = 0;
  nextPrice = 0;
  defaultMoney = 1000;
  
  users: User[] = [];
  
  mean: number = 70;
  dev = 10;
  algorithm: AuctionPriceGeneratorAlgorithm = AuctionPriceGeneratorAlgorithm.NormalDistribution;
  
  priceList: number[] = [];
  
  async startAllAuction(io: Server, socket: Socket, auctionType: AuctionType) {
    this.isAuctionStarted = true;
    this.auctionType = auctionType;
    this.currentRound = 0;
    this.currentPrice = 0;
    this.nextPrice = generateAuctionPrice(this.mean, this.dev, this.algorithm);
    this.users.forEach((u) => {
      u.money = this.defaultMoney;
      u.bidHistory = [];
    });
    this.auctionId = generateAuctionId();
    
    try {
      await query(`INSERT INTO auctions
                   VALUES (?, ?, ?, ?, ?)`, [this.auctionId, this.mean, this.dev, this.auctionType, this.algorithm]);
      
      await query(`CREATE TABLE IF NOT EXISTS ${this.auctionId}_record
                   (
                       id          int primary key auto_increment,
                       user        varchar(255) not null,
                       round       int          not null,
                       bid         double       not null,
                       startMoney  double       not null,
                       remainMoney double       not null
                   )`);
      
      await query(`CREATE TABLE IF NOT EXISTS ${this.auctionId}_price
                   (
                        round       int   primary key,
                        price double not null
                   )`);
      
      io.sockets.emit('auction-start', {
        auctionType: this.auctionType,
        money: this.defaultMoney,
        currentRound: this.currentRound,
        currentPrice: this.currentPrice,
        currentBid: 0
      });
      
      socket.emit('next-round-price-admin', {
        nextPrice: this.nextPrice
      });
      
      console.log('auction: ', this.auctionId, ' start!');
    } catch (e) {
      console.error(e);
      socket.emit('auction-start-error', {
        error: e.toString()
      });
    }
  }
  
  async startNextRound(io: Server, socket: Socket, thisRoundPrice?: number) {
    this.currentRound += 1;
    this.currentPrice = thisRoundPrice || this.nextPrice;
    
    try {
      await query(`INSERT INTO ${this.auctionId}_price
                   VALUES (?, ?) `, [this.currentRound, this.currentPrice]);
      
      this.priceList.push(this.currentPrice);
      
      io.sockets.emit('next-round', {
        currentRound: this.currentRound,
        currentPrice: this.currentPrice,
        currentBid: 0,
        hasBid: false
      });
      
      this.nextPrice = generateAuctionPrice(this.mean, this.dev, this.algorithm);
      socket.emit('next-round-price-admin', {
        nextPrice: this.nextPrice
      });
    } catch (e) {
      console.error(e);
      socket.emit('next-round-start-error', {
        error: e.toString()
      });
    }
    
  }
  
  resumeAuction(socket: Socket, userId: string) {
    let user: User = _.findLast(this.users, user => user.userId === userId) as any;
    
    if (_.isNil(user)) {
      user = new User(userId, this.defaultMoney);
      this.users.push(user);
    }
    
    console.log(this.users, this.users.length);
    
    if (!this.isAuctionStarted) {
      this.stopAuction(socket);
      return;
    }
    
    const currentBidResult = _.findLast(user.bidHistory, (u) => u.round === this.currentRound);
    
    socket.emit('resume-auction', {
      auctionType: this.auctionType,
      money: user.money,
      currentRound: this.currentRound,
      currentPrice: this.currentPrice,
      currentBid: currentBidResult ? currentBidResult.bid : 0,
      hasBid: !_.isNil(_.findLast(user.bidHistory, (u) => u.round === this.currentRound))
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
  
  bid(socket: Socket, bidPrice: number, userId: string) {
    let user: User = _.findLast(this.users, user => user.userId === userId) as any;
    
    user.bid(this.currentRound, bidPrice);
    
    socket.emit('bid-successful', {
      money: user.money,
      currentBid: bidPrice,
      hasBid: true
    })
  }
}

export const auction = new Auction();

