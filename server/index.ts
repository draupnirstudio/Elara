import * as express from 'express';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as http from 'http';
import {generateUserId} from './src/helpers/userId-generator';
import * as _ from 'lodash';
import * as sio from 'socket.io';
import {auctionHandler} from './src/auction-handler';
import {auction} from './src/auction';
import {query} from './src/lib/mysql-connector';

const app: express.Application = express();
const server = new http.Server(app);
const io = sio(server);

const port = 5000;

app.use(morgan('combined'));
app.use(helmet());

app.get('/', (req, res) => {
  res.send({response: 'I am alive'}).status(200);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Elara app listening on port ${port}!`);
});

async function bootstrap() {
  await query(`CREATE TABLE IF NOT EXISTS auctions
             (
                 auction_id   varchar(255) primary key,
                 mean         double not null,
                 standard_dev double not null,
                 auction_type varchar(255) not null,
                 algorithm varchar(255) not null
             )`);
  
  console.log('Auction Table Created.');
  
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
      
      console.log('user connected:', userId);
      
      auction.resumeAuction(socket, userId);
      
      auctionHandler(io, socket, userId);
    });
    
    socket.on('disconnect', () => {
      console.log('user disconnected:', userId);
    });
  });
  
};


bootstrap();


