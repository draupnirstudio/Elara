import {AuctionType} from './auction-type';
import {Server, Socket} from 'socket.io';
import {User} from './user';
import {generateAuctionId} from './helpers/auction-id-generator';

import {query} from './lib/mysql-connector';
import {AuctionAlgorithm, generateAuctionPrice} from './helpers/auction-price-generator';
import * as _ from 'lodash';
import logger from './lib/logger';

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
  deviation: number = 10;
  algorithm: AuctionAlgorithm = AuctionAlgorithm.NormalDistribution;
  
  priceList: number[] = [];
  
  bidHistory: any[] = [];
  
  winRounds: any = {};
  
  async startAllAuction(io: Server, socket: Socket, auctionType: AuctionType) {
    this.isAuctionStarted = true;
    this.auctionType = auctionType;
    this.currentRound = 0;
    this.currentPrice = 0;
    this.nextPrice = generateAuctionPrice(this.mean, this.deviation, this.algorithm);
    this.users.forEach((u) => {
      u.money = this.defaultMoney;
      u.bidHistory = [];
    });
    this.priceList = [];
    this.auctionId = generateAuctionId();
    this.bidHistory = [];
    this.winRounds = {};
    
    try {
      await query(`INSERT INTO auctions
                   VALUES (?, ?, ?, ?, ?)`, [this.auctionId, this.mean, this.deviation, this.auctionType, this.algorithm]);
      
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
      console.log(`${this.auctionId}_record table created.`);
      
      await query(`CREATE TABLE IF NOT EXISTS ${this.auctionId}_price
                   (
                        round       int   primary key,
                        price double not null
                   )`);
      console.log(`${this.auctionId}_price table created.`);
      
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
      
      socket.emit('algorithm-config-admin', {
        algorithm: this.algorithm,
        mean: this.mean,
        deviation: this.deviation
      });
      
      logger.info(`auction ${this.auctionId} start!`);
    } catch (e) {
      console.error(e);
      logger.error(`auction start error: ${e.toString()}`);
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
      
      this.nextPrice = generateAuctionPrice(this.mean, this.deviation, this.algorithm);
      socket.emit('next-round-price-admin', {
        nextPrice: this.nextPrice
      });
      
      logger.info(`round ${this.currentRound} start`);
    } catch (e) {
      console.error(e);
      logger.error(`next round start error: ${e.toString()}`);
      socket.emit('next-round-start-error', {
        error: e.toString()
      });
    }
  }
  
  setDefaultMoney(io: Server, defaultMoney: number) {
    this.defaultMoney = defaultMoney;
    
    if (this.currentRound === 0) {
      this.users.forEach((u) => u.money = defaultMoney);
      io.sockets.emit('default-money-changed', {defaultMoney});
    }
    
    logger.info(`default money set to ${this.defaultMoney}`);
  }
  
  setAlgorithm(socket: Socket, algorithm: AuctionAlgorithm) {
    this.algorithm = algorithm;
    logger.info(`algorithm set to ${this.algorithm}`);
    socket.emit('algorithm-changed', {algorithm});
  }
  
  setAlgorithmMean(socket: Socket, mean: number) {
    this.mean = mean;
    logger.info(`algorithm mean set to ${this.mean}`);
    socket.emit('algorithm-mean-changed', {mean});
  }
  
  setAlgorithmDeviation(socket: Socket, deviation: number) {
    this.deviation = deviation;
    logger.info(`algorithm deviation set to ${this.deviation}`);
    socket.emit('algorithm-deviation-changed', {deviation});
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
      hasBid: !_.isNil(currentBidResult),
      winRound: this.winRounds[userId] || 0
    });
    
    console.log(this.winRounds, this.winRounds[userId]);
  }
  
  async resumeAuctionAdmin(socket: Socket) {
    try {
      socket.emit('resume-auction', {
        isAuctionStart: this.isAuctionStarted,
        auctionType: this.auctionType,
        currentRound: this.currentRound,
        currentPrice: this.currentPrice,
        defaultMoney: this.currentRound === 0 ? 0 : this.defaultMoney,
        winRounds: this.winRounds
      });
      
      socket.emit('next-round-price-admin', {
        nextPrice: this.currentRound === 0 ? 0 : this.nextPrice
      });
      
      socket.emit('algorithm-config-admin', {
        algorithm: this.algorithm,
        mean: this.mean,
        deviation: this.deviation
      });
      
      if (_.isNil(this.auctionId)) {
        return;
      }
      
      const results = await query(`SELECT user, round, price, startMoney, bid, remainMoney
    FROM ${this.auctionId}_record`);
      socket.emit('bid-history-fetched', results);
    } catch (e) {
      logger.error(`resume admin auction error: ${e.toString()}`);
      console.error(e);
    }
  }
  
  stopAuction(socket: Socket) {
    this.isAuctionStarted = false;
    this.auctionType = AuctionType.NoAuction;
    
    socket.emit('auction-stop');
  }
  
  stopAllAuction(io: Server) {
    this.isAuctionStarted = false;
    this.auctionType = AuctionType.NoAuction;
    this.currentRound = 0;
    this.currentPrice = 0;
    this.nextPrice = 0;
    this.priceList = [];
    this.bidHistory = [];
    this.users.forEach((u) => {
      u.money = this.defaultMoney;
      u.bidHistory = [];
    });
    
    io.sockets && io.sockets.emit('auction-stop');
    logger.info(`auction ${this.auctionId} stopped`);
  }
  
  bid(io: Server, socket: Socket, adminSocket: Socket | null, bidPrice: number, userId: string) {
    bidLock.lock(async () => {
      console.log('user:', userId, 'bid: ', bidPrice, 'current price: ', this.currentPrice);
      if (bidPrice <= this.currentPrice) {
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
        
        const bidInfo = {
          user: userId,
          startMoney: user.money + bidPrice,
          bid: bidPrice,
          price: this.currentPrice,
          remainMoney: user.money,
          round: this.currentRound
        };
        
        adminSocket && adminSocket.emit('user-did-bid', bidInfo);
        
        this.bidHistory.push(bidInfo);
        this.updateAuctionResult(io);
        
        this.currentPrice = bidPrice;
        
        socket.emit('bid-successful', {
          money: user.money,
          currentBid: bidPrice,
          hasBid: true
        });
        
        io.sockets.emit('current-price-updated', {
          currentPrice: bidPrice
        });
        
        bidLock.unlock();
      } catch (e) {
        console.error(e);
        logger.error(`bid error: ${e.toString()}`);
        socket.emit('bid-error', {
          error: e.toString(),
          code: AuctionErrorCode.UnknownError
        });
        bidLock.unlock();
      }
    });
  }
  
  // TODO: Optimize
  updateAuctionResult(io: Server) {
    const result: any[] = [];
    const price: number[] = [];
    this.bidHistory.forEach((h) => {
      const round = h.round;
      if (result.length < round) {
        result.push(h.user);
        price.push(h.bid);
      } else {
        if (h.bid > price[round - 1]) {
          result[round - 1] = h.user;
          price[round - 1] = h.bid;
        }
      }
    });
    
    this.winRounds = {};
    result.forEach((r) => {
      if (this.winRounds[r] === undefined) {
        this.winRounds[r] = 1;
      } else {
        this.winRounds[r] = this.winRounds[r] + 1;
      }
    });
    
    io.sockets.emit('win-rounds-did-update', this.winRounds);
  }
  
}

export const auction = new Auction();
