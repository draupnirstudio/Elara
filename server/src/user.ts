export class User {
  money:number;
  userId: string;
  constructor(userId: string, defaultMoney: number) {
    this.money = defaultMoney;
    this.userId = userId;
  }
}