import * as express from 'express';
import * as morgan from 'morgan';
import * as helmet from 'helmet';

// Create a new express application instance
const app: express.Application = express();
const port = 5000;

app.use(morgan('combined'));
app.use(helmet());


app.listen(port, () => {
    console.log(`Elara app listening on port ${port}!`);
});

