import {AuctionType} from './auction-type';
import {Server, Socket} from 'socket.io';
import {User} from './user';
import {generateAuctionId} from './helpers/auction-id-generator';

import {query} from './lib/mysql-connector';
import {AuctionPriceGeneratorAlgorithm, generateAuctionPrice} from './helpers/auction-price-generator';
import * as _ from 'lodash';

import {Mutex} from 'locks';

const lock = new Mutex();

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
      hasBid: !_.isNil(currentBidResult)
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
  
  bid(io: Server, socket: Socket, bidPrice: number, userId: string) {
    lock.lock(async () => {
      console.log('user:', userId, 'bid: ', bidPrice, 'current price: ', this.currentPrice);
      if (bidPrice <= this.currentPrice) {
        socket.emit('bid-error', {
          error: 'bid should larger than current price',
          code: AuctionErrorCode.BidShouldLargerThanCurrentPrice
        });
        lock.unlock();
        return;
      }
      
      let user: User = _.findLast(this.users, user => user.userId === userId) as any;
      if (_.isNil(user)) {
        console.error('user not found', this.users.map(u => u.userId), userId);
        socket.emit('bid-error', {
          error: 'user not found',
          code: AuctionErrorCode.BidUserNotFound
        });
        lock.unlock();
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
        lock.unlock();
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
          lock.unlock();
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
        
        lock.unlock();
      } catch (e) {
        console.log(e);
        socket.emit('bid-error', {
          error: e.toString(),
          code: AuctionErrorCode.UnknownError
        });
        lock.unlock();
      }
    });
  }
  
}

export const auction = new Auction();

