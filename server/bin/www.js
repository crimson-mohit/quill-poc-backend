#!/usr/bin/env node

import 'dotenv/config';
import debugLib from 'debug';
import http from 'http';
import { Server } from 'socket.io';
import app from '../app';
import socketHandler from '../socket-handler/index';

const debug = debugLib('quill-poc-backend:server');
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


const io = new Server(server, {
  cors: {
    origin: JSON.parse(process.env.CLIENT_ORIGIN),
    methods: ['GET', 'POST']
  }
});

const onConnection = (socket) => {
  socketHandler(io, socket);
}

io.on('connection', onConnection);


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
