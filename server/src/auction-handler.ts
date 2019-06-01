import {Socket} from 'socket.io';
import {AuctionType} from './auction-type';
import {auction} from './auction';


export function auctionHandler(socket: Socket, userId: string) {
  socket.on('start-english-auction-admin', (data: any) => {
    auction.startAuction(socket, AuctionType.EnglishAuction);
    console.log('auction started:', AuctionType.EnglishAuction);
  });
  
  socket.on('start-next-round-admin', (data: any) => {
    auction.startNextRound(socket);
  });
  
  socket.on('stop-auction-admin', (data: any) => {
    auction.stopAuction(socket);
    console.log('auction stopped:', auction.auctionType);
  });
}
