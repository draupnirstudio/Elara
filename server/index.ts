import * as express from 'express';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as http from 'http';
import {englishAuctionHandler} from './src/english-auction';
import {generateUserId} from './src/helpers/userId-generator';
import * as _ from 'lodash';

const app: express.Application = express();
const server = new http.Server(app);
const io = require('socket.io')(server);

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
    console.log(data);
    
    const _userId = _.get(data, 'userId');
    
    if (_.isNil(_userId)) {
      userId = generateUserId();
    } else {
      userId = _userId;
    }
    
    users.push(userId);
    
    socket.emit('user-id-generated', {
      userId
    });
  
    console.log('a user connected:', userId, users);
  
    englishAuctionHandler(socket, userId);
  });
  
  
  socket.on('disconnect', () => {
    _.remove(users, (u) => u === userId);
    console.log('user disconnected:', userId, users);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Elara app listening on port ${port}!`);
});
