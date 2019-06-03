import {Server, Socket} from 'socket.io';
import {AuctionType} from './auction-type';
import {auction} from './auction';
import * as _ from 'lodash';

let adminUserId: string;

export function auctionHandler(io: Server, sockets: { [key: string]: Socket | null }, socket: Socket, userId: string) {
  socket.on('admin-user-registered', (data: any) => {
    adminUserId = data.userId;
    console.log('admin-user-registered', adminUserId);
  });
  
  socket.on('resume-auction', (data: any) => {
    auction.resumeAuction(socket, userId);
  });
  
  socket.on('resume-auction-admin', async (data: any) => {
    await auction.resumeAuctionAdmin(socket);
  });
  
  socket.on('start-english-auction-admin', async (data: any) => {
    await auction.startAllAuction(io, socket, AuctionType.EnglishAuction);
    console.log('auction started:', AuctionType.EnglishAuction);
  });
  
  socket.on('start-next-round-admin', async (data: any) => {
    const nextPrice = Number(data.nextPrice);
    nextPrice > 0
      ? await auction.startNextRound(io, socket, nextPrice)
      : auction.startNextRound(io, socket);
  });
  
  socket.on('stop-auction-admin', (data: any) => {
    auction.stopAllAuction(io);
    console.log('auction stopped:', auction.auctionType);
  });
  
  socket.on('set-default-money-admin', (data: { defaultMoney: number }) => {
    auction.setDefaultMoney(io, data.defaultMoney);
    console.log('default money changed to: ', data.defaultMoney);
  });
  
  socket.on('bid', async (data: { bid: number }) => {
    auction.bid(io, socket, _.get(sockets, adminUserId), Number(data.bid), userId);
  })
  
}
