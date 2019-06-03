import {AuctionType} from './auction-type';
import {Server, Socket} from 'socket.io';
import {User} from './user';
import {generateAuctionId} from './helpers/auction-id-generator';

import {query} from './lib/mysql-connector';
import {AuctionPriceGeneratorAlgorithm, generateAuctionPrice} from './helpers/auction-price-generator';
import * as _ from 'lodash';

import {Mutex} from 'locks';

const bidLock = new Mutex();

enum AuctionErrorCode {
  UnknownError = 1000,
  BidUserNotFound = 1001,
  UserAlreadyBid = 1002,
  BidShouldLargerThanCurrentPrice = 1003,
  BidShouldLessOrEqualThanRemainMoney = 1004,
}

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
                       price double not null,
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
        error: e.toString(),
        code: AuctionErrorCode.UnknownError
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
  
  setDefaultMoney(io: Server, defaultMoney: number) {
    this.defaultMoney = defaultMoney;
    if (this.currentRound === 0) {
      this.users.forEach((u) => u.money = defaultMoney);
      io.sockets.emit('default-money-changed', {
        defaultMoney
      });
    }
  }
  
  resumeAuction(socket: Socket, userId: string) {
    let user: User = _.findLast(this.users, user => user.userId === userId) as any;
    
    if (_.isNil(user)) {
      user = new User(userId, this.defaultMoney);
      this.users.push(user);
    }
    
    const currentBidResult = _.findLast(user.bidHistory, (u) => u.round === this.currentRound);
    
    socket.emit('resume-auction', {
      isAuctionStart: this.isAuctionStarted,
      auctionType: this.auctionType,
      money: user.money,
      currentRound: this.currentRound,
      currentPrice: this.currentPrice,
      currentBid: currentBidResult ? currentBidResult.bid : 0,
      hasBid: !_.isNil(currentBidResult)
    });
  }
  
  resumeAuctionAdmin(socket: Socket) {
    socket.emit('resume-auction', {
      isAuctionStart: this.isAuctionStarted,
      auctionType: this.auctionType,
      currentRound: this.currentRound,
      currentPrice: this.currentPrice,
      defaultMoney: this.defaultMoney
    });
    
    this.isAuctionStarted && socket.emit('next-round-price-admin', {
      nextPrice: this.nextPrice
    });
  }
  
  stopAuction(socket: Socket) {
    this.isAuctionStarted = false;
    this.auctionType = AuctionType.NoAuction;
    
    socket.emit('auction-stop');
  }
  
  stopAllAuction(io: Server) {
    this.isAuctionStarted = false;
    this.auctionType = AuctionType.NoAuction;
    
    io.sockets && io.sockets.emit('auction-stop');
  }
  
  bid(io: Server, socket: Socket, adminSocket: Socket | null, bidPrice: number, userId: string) {
    bidLock.lock(async () => {
      console.log('user:', userId, 'bid: ', bidPrice, 'current price: ', this.currentPrice);
      if (bidPrice <= this.currentPrice) {
        console.log(bidPrice, this.currentPrice);
        socket.emit('bid-error', {
          error: 'bid should larger than current price',
          code: AuctionErrorCode.BidShouldLargerThanCurrentPrice
        });
        bidLock.unlock();
        return;
      }
      
      let user: User = _.findLast(this.users, user => user.userId === userId) as any;
      if (_.isNil(user)) {
        console.error('user not found', this.users.map(u => u.userId), userId);
        socket.emit('bid-error', {
          error: 'user not found',
          code: AuctionErrorCode.BidUserNotFound
        });
        bidLock.unlock();
        return;
      }
      
      if (user.money < bidPrice) {
        console.error('cannot bid', user.money, bidPrice);
        socket.emit('bid-error', {
          error: 'bid should less or equal than remain money',
          bid: bidPrice,
          money: user.money,
          code: AuctionErrorCode.BidShouldLessOrEqualThanRemainMoney
        });
        bidLock.unlock();
        return;
      }
      
      try {
        const hasBidQuery = `SELECT count(1) as hasBidCount from ${this.auctionId}_record
where user = '${userId}' and round = '${this.currentRound}'`;
        const hasBid = await query(hasBidQuery) as any;
        
        if (hasBid[0].hasBidCount > 0) {
          socket.emit('bid-error', {
            error: 'you have already bid',
            code: AuctionErrorCode.UserAlreadyBid
          });
          bidLock.unlock();
          return;
        }
        
        await query(`INSERT INTO ${this.auctionId}_record(user, round, price, bid, startMoney, remainMoney)
                   VALUES (?, ?, ?, ?, ?, ?) `, [userId, this.currentRound, this.currentPrice, bidPrice, user.money, user.money - bidPrice]);
        
        user.bid(this.currentRound, bidPrice);
        this.currentPrice = bidPrice;
        
        socket.emit('bid-successful', {
          money: user.money,
          currentBid: bidPrice,
          hasBid: true
        });
        
        io.sockets.emit('current-price-updated', {
          currentPrice: bidPrice
        });
        
        adminSocket && adminSocket.emit('user-did-bid', {
          userId,
          startMoney: user.money + bidPrice,
          bid: bidPrice,
          remainMoney: user.money,
          round: this.currentRound
        });
        
        bidLock.unlock();
      } catch (e) {
        console.log(e);
        socket.emit('bid-error', {
          error: e.toString(),
          code: AuctionErrorCode.UnknownError
        });
        bidLock.unlock();
      }
    });
  }
  
}

export const auction = new Auction();

