#!/usr/bin/env node

import 'dotenv/config';
import debugLib from 'debug';
import http from 'http';
import { Server } from "socket.io";
const debug = debugLib('quill-poc-backend:server');
import app from '../app';

import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import Delta from "quill-delta";

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  let serverSideDelta = {};

  socket.on('updateDelta', data => {
    console.log('incoming request ===> ', data, '\ndelta ===> ', JSON.stringify(data.delta, null, 4));

    let cfg = {};
    serverSideDelta = {
      ops: new Delta(serverSideDelta.ops).compose(new Delta(data.delta.ops)).ops
    };
    let converter = new QuillDeltaToHtmlConverter(serverSideDelta.ops, cfg);
    let html = converter.convert();

    console.log('html ===> ', html, '\nserverSideDelta ===> ', serverSideDelta);
  });
});

function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
  ? 'Pipe ' + port
  : 'Port ' + port;

  switch (error.code) {
    case 'EACCES': {
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    }
    break;
    case 'EADDRINUSE': {
      console.error(bind + ' is already in use');
      process.exit(1);
    }
    break;
    default: {
      throw error;
    }
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
  ? 'pipe ' + addr
  : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
