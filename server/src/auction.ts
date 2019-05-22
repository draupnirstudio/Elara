import {Socket} from 'socket.io';
import {AuctionType} from './auction-type';

let isAuctionStarted = false;
let auctionType: AuctionType = AuctionType.NoAuction;

export function auctionHandler(socket: Socket, userId: string) {
  socket.on('auction-user-connect', (data: any) => {
    console.log('auction-user-connect', isAuctionStarted);
    if (isAuctionStarted) {
      socket.emit('auction-start', {
        auctionType
      });
    }
  });
  
  socket.on('start-english-auction-admin', (data: any) => {
    isAuctionStarted = true;
    auctionType = AuctionType.EnglishAuction;
    console.log('auction started:', auctionType);
    socket.broadcast.emit('auction-start', {auctionType});
  });
  
  socket.on('stop-auction-admin', (data: any) => {
    console.log('auction stopped:', auctionType);
    isAuctionStarted = false;
    auctionType = AuctionType.NoAuction;
    socket.broadcast.emit('auction-stop', {auctionType});
  });
}
