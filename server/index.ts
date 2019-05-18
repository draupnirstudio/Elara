import * as express from 'express';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as http from 'http';

const app: express.Application = express();
const port = 5000;

app.use(morgan('combined'));
app.use(helmet());

const server = new http.Server(app);
const io = require('socket.io')(server);

io.on('connection', (socket: any) => {
    console.log('a user connected');
});

server.listen(port, () => {
    console.log(`Elara app listening on port ${port}!`);
});