export function englishAuctionHandler(socket: any, userId: string) {
  socket.on('english-auction-user-connect', (data: any) => {
    console.log('english-auction-user-connect', userId);
  });
  
  socket.on('english-auction-user-disconnect', (data: any) => {
    console.log('english-auction-user-disconnect:', userId);
  });
}
