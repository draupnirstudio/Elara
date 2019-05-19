import * as express from 'express';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as http from 'http';

const app: express.Application = express();
const server = new http.Server(app);
const io = require('socket.io')(server);

const port = 5000;

app.use(morgan('combined'));
app.use(helmet());

app.get('/', (req, res) => {
  res.send({response: 'I am alive'}).status(200);
});

io.on('connection', (socket: any) => {
  console.log('a user connected');
  
  setTimeout(() => {
    socket.emit('FromAPI', 'lalala');
  }, 5000);
  
  socket.on('disconnect', () => console.log('Client disconnected'));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Elara app listening on port ${port}!`);
});