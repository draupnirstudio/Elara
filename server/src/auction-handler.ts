import {Server, Socket} from 'socket.io';
import {AuctionType} from './auction-type';
import {auction} from './auction';


export function auctionHandler(io: Server, socket: Socket, userId: string) {
  socket.on('start-english-auction-admin', (data: any) => {
    auction.startAllAuction(io, socket, AuctionType.EnglishAuction);
    console.log('auction started:', AuctionType.EnglishAuction);
  });
  
  socket.on('start-next-round-admin', (data: any) => {
    auction.startNextRound(socket);
  });
  
  socket.on('stop-auction-admin', (data: any) => {
    auction.stopAllAuction(io);
    console.log('auction stopped:', auction.auctionType);
  });
  
  
  
  
  socket.on('bid',(data: any) => {
  
  })
  
}
