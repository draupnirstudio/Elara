export class User {
  money:number;
  userId: string;
  
  bidHistory: any = [];
  
  constructor(userId: string, defaultMoney: number) {
    this.money = defaultMoney;
    this.userId = userId;
  }
  
  bid(round: number, price: number) {
    this.money -= price;
    this.bidHistory.push({
      round,
      bid: price
    });
  }
}