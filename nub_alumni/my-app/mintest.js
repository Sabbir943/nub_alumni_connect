const http = require('http');
const { Server } = require('socket.io');
const httpServer = http.createServer((req, res) => {
  if (req.url === '/') { res.writeHead(200); res.end('ok'); return; }
});
const io = new Server(httpServer, { cors: { origin: (o) => true } });
io.on('connection', (s) => console.log('CONNECTED', s.id));
httpServer.listen(5099, () => console.log('minimal up on 5099'));
