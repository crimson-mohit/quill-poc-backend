import writeDocument from './document/write';
import readDocument from './document/read';

// socket events registered
module.exports = (io, socket) => {
  socket.on('document:write', writeDocument);
  socket.on('document:read', readDocument);
}
