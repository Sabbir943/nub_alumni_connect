const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track online users: email -> socketId
  const onlineUsers = new Map();

  // Track active calls: callerEmail -> { callerSocketId, calleeEmail, calleeSocketId, callType }
  const activeCalls = new Map();

  io.on('connection', (socket) => {
    console.log('[Socket.IO] User connected:', socket.id);

    // User joins with their email
    socket.on('join', (email) => {
      if (!email) return;
      onlineUsers.set(email, socket.id);
      socket.data.email = email;
      console.log(`[Socket.IO] User joined: ${email} (${socket.id})`);

      // Notify all clients about online status
      io.emit('user-online', { email, online: true });
    });

    // User initiates a call
    socket.on('call-user', ({ calleeEmail, callType }) => {
      const callerEmail = socket.data.email;
      if (!callerEmail || !calleeEmail) return;

      const calleeSocketId = onlineUsers.get(calleeEmail);
      if (!calleeSocketId) {
        socket.emit('call-failed', { reason: 'User is offline' });
        return;
      }

      // Check if callee is already in a call
      for (const [key, call] of activeCalls) {
        if (call.calleeEmail === calleeEmail || call.callerEmail === calleeEmail) {
          socket.emit('call-failed', { reason: 'User is already in a call' });
          return;
        }
        if (call.callerEmail === callerEmail) {
          socket.emit('call-failed', { reason: 'You are already in a call' });
          return;
        }
      }

      // Store call state
      activeCalls.set(callerEmail, {
        callerSocketId: socket.id,
        callerEmail,
        calleeEmail,
        calleeSocketId,
        callType,
      });

      // Notify callee
      io.to(calleeSocketId).emit('incoming-call', {
        callerEmail,
        callerName: callerEmail.split('@')[0],
        callType,
      });

      console.log(`[Socket.IO] Call initiated: ${callerEmail} -> ${calleeEmail} (${callType})`);
    });

    // Callee answers the call
    socket.on('answer-call', ({ callerEmail }) => {
      const calleeEmail = socket.data.email;
      if (!calleeEmail || !callerEmail) return;

      const call = activeCalls.get(callerEmail);
      if (!call || call.calleeEmail !== calleeEmail) return;

      // Update callee socket ID
      call.calleeSocketId = socket.id;
      activeCalls.set(callerEmail, call);

      // Notify caller that call was answered
      io.to(call.callerSocketId).emit('call-answered', { calleeEmail });
      console.log(`[Socket.IO] Call answered: ${calleeEmail} accepted from ${callerEmail}`);
    });

    // Callee declines the call
    socket.on('decline-call', ({ callerEmail }) => {
      const calleeEmail = socket.data.email;
      if (!calleeEmail || !callerEmail) return;

      const call = activeCalls.get(callerEmail);
      if (!call || call.calleeEmail !== calleeEmail) return;

      // Notify caller that call was declined
      io.to(call.callerSocketId).emit('call-declined', { calleeEmail });

      // Clean up
      activeCalls.delete(callerEmail);
      console.log(`[Socket.IO] Call declined: ${calleeEmail} declined from ${callerEmail}`);
    });

    // Either party ends the call
    socket.on('end-call', ({ otherEmail }) => {
      const myEmail = socket.data.email;
      if (!myEmail || !otherEmail) return;

      const call = activeCalls.get(myEmail) || activeCalls.get(otherEmail);
      if (!call) return;

      // Notify the other party
      const otherSocketId = call.callerEmail === myEmail
        ? call.calleeSocketId
        : call.callerSocketId;

      if (otherSocketId) {
        io.to(otherSocketId).emit('call-ended', { endedBy: myEmail });
      }

      // Clean up
      activeCalls.delete(call.callerEmail);
      console.log(`[Socket.IO] Call ended: ${myEmail} ended call with ${otherEmail}`);
    });

    // WebRTC signaling: SDP offer
    socket.on('offer', ({ to, sdp }) => {
      const toSocketId = onlineUsers.get(to);
      if (toSocketId) {
        io.to(toSocketId).emit('offer', {
          from: socket.data.email,
          sdp,
        });
      }
    });

    // WebRTC signaling: SDP answer
    socket.on('answer', ({ to, sdp }) => {
      const toSocketId = onlineUsers.get(to);
      if (toSocketId) {
        io.to(toSocketId).emit('answer', {
          from: socket.data.email,
          sdp,
        });
      }
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', ({ to, candidate }) => {
      const toSocketId = onlineUsers.get(to);
      if (toSocketId) {
        io.to(toSocketId).emit('ice-candidate', {
          from: socket.data.email,
          candidate,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const email = socket.data.email;
      if (email) {
        onlineUsers.delete(email);

        // Check if user was in a call
        const call = activeCalls.get(email);
        if (call) {
          // Notify the other party
          const otherSocketId = call.callerEmail === email
            ? call.calleeSocketId
            : call.callerSocketId;

          if (otherSocketId) {
            io.to(otherSocketId).emit('call-ended', { endedBy: email });
          }
          activeCalls.delete(call.callerEmail);
        }

        // Also clean up any calls where this user was the callee
        for (const [callerEmail, call] of activeCalls) {
          if (call.calleeEmail === email) {
            io.to(call.callerSocketId).emit('call-ended', { endedBy: email });
            activeCalls.delete(callerEmail);
          }
        }

        io.emit('user-online', { email, online: false });
        console.log(`[Socket.IO] User disconnected: ${email}`);
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running`);
  });
});
