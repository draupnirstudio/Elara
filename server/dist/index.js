"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
// Create a new express application instance
const app = express();
const port = 5000;
app.use(morgan('combined'));
app.use(helmet());
app.listen(port, () => {
    console.log('Example app listening on port 3000!');
});
