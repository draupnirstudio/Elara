import * as express from 'express';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as http from 'http';
import {generateUserId} from './src/helpers/userId-generator';
import * as _ from 'lodash';
import * as sio from 'socket.io';
import {auctionHandler} from './src/auction-handler';
import {auction} from './src/auction';

const app: express.Application = express();
const server = new http.Server(app);
const io = sio(server);

const port = 5000;

app.use(morgan('combined'));
app.use(helmet());

app.get('/', (req, res) => {
  res.send({response: 'I am alive'}).status(200);
});

const users: string[] = [];

io.on('connection', (socket: any) => {
  let userId: string;
  
  socket.on('user-connect', (data: any) => {
    const _userId = _.get(data, 'userId');
    
    if (_.isNil(_userId)) {
      userId = generateUserId();
      socket.emit('user-id-generated', {
        userId
      });
    } else {
      userId = _userId;
    }
    
    users.push(userId);
    
    console.log('user connected:', userId, users.length, users);
  
    auctionHandler(socket, userId);
    
    if (auction.isAuctionStarted) {
      socket.emit('auction-start', {
        auctionType: auction.auctionType,
        defaultMoney: auction.defaultMoney,
        currentRound: auction.currentRound,
        currentPrice: auction.currentPrice
      });
    } else {
      auction.stopAuction(socket);
    }
  });
  
  socket.on('disconnect', () => {
    _.remove(users, (u) => u === userId);
    console.log('user disconnected:', userId, users);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Elara app listening on port ${port}!`);
});
