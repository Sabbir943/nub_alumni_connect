const { Server } = require('socket.io');
const { MongoClient, ObjectId } = require('mongodb');
const http = require('http');

const PORT = process.env.SOCKET_PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'nub_alumni';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

let db = null;

async function connectDB() {
  if (db) return db;
  const client = await MongoClient.connect(MONGODB_URI);
  db = client.db(DB_NAME);
  return db;
}

// Create HTTP server for health checks
const httpServer = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'socket-server' }));
  }
});

async function createCallNotification({ recipientEmail, callerEmail, callerName, callType }) {
  try {
    const database = await connectDB();
    const notifications = database.collection('notifications');
    const result = await notifications.insertOne({
      recipientEmail,
      type: 'call_incoming',
      actorEmail: callerEmail,
      actorName: callerName,
      callType: callType || 'video',
      message: `${callerName} is calling you (${callType || 'video'})`,
      link: `/dashboard/alumni/text?chatWith=${callerEmail}`,
      read: false,
      callStatus: 'ringing',
      createdAt: new Date(),
    });
    return result.insertedId.toString();
  } catch (err) {
    console.error('[Socket.IO] Failed to create call notification:', err.message);
    return null;
  }
}

async function updateCallNotification(notificationId, updates) {
  try {
    if (!notificationId) return;
    const database = await connectDB();
    const notifications = database.collection('notifications');
    await notifications.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: updates }
    );
  } catch (err) {
    console.error('[Socket.IO] Failed to update call notification:', err.message);
  }
}

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

const onlineUsers = new Map();
const activeCalls = new Map();

io.on('connection', (socket) => {
  console.log('[Socket.IO] User connected:', socket.id);

  socket.on('join', (email) => {
    if (!email) return;
    onlineUsers.set(email, socket.id);
    socket.data.email = email;
    console.log(`[Socket.IO] User joined: ${email} (${socket.id})`);
    io.emit('user-online', { email, online: true });
  });

  socket.on('call-user', async ({ calleeEmail, callType }) => {
    const callerEmail = socket.data.email;
    if (!callerEmail || !calleeEmail) return;

    const calleeSocketId = onlineUsers.get(calleeEmail);
    if (!calleeSocketId) {
      socket.emit('call-failed', { reason: 'User is offline' });
      return;
    }

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

    const notificationId = await createCallNotification({
      recipientEmail: calleeEmail,
      callerEmail,
      callerName: callerEmail.split('@')[0],
      callType,
    });

    activeCalls.set(callerEmail, {
      callerSocketId: socket.id,
      callerEmail,
      calleeEmail,
      calleeSocketId,
      callType,
      notificationId,
      timer: null,
    });

    const timer = setTimeout(async () => {
      const call = activeCalls.get(callerEmail);
      if (call && !call.answered) {
        await updateCallNotification(call.notificationId, {
          callStatus: 'missed',
          message: `Missed call from ${callerEmail.split('@')[0]}`,
        });
        io.to(call.callerSocketId).emit('call-failed', { reason: 'No answer' });
        io.to(call.calleeSocketId).emit('call-missed', { callerEmail });
        activeCalls.delete(callerEmail);
        console.log(`[Socket.IO] Call missed: ${callerEmail} -> ${calleeEmail}`);
      }
    }, 30000);

    activeCalls.get(callerEmail).timer = timer;

    io.to(calleeSocketId).emit('incoming-call', {
      callerEmail,
      callerName: callerEmail.split('@')[0],
      callType,
      notificationId,
    });

    console.log(`[Socket.IO] Call initiated: ${callerEmail} -> ${calleeEmail} (${callType})`);
  });

  socket.on('answer-call', async ({ callerEmail }) => {
    const calleeEmail = socket.data.email;
    if (!calleeEmail || !callerEmail) return;

    const call = activeCalls.get(callerEmail);
    if (!call || call.calleeEmail !== calleeEmail) return;

    if (call.timer) {
      clearTimeout(call.timer);
      call.timer = null;
    }

    call.answered = true;

    await updateCallNotification(call.notificationId, {
      callStatus: 'answered',
      read: true,
    });

    call.calleeSocketId = socket.id;
    activeCalls.set(callerEmail, call);

    io.to(call.callerSocketId).emit('call-answered', { calleeEmail });
    console.log(`[Socket.IO] Call answered: ${calleeEmail} accepted from ${callerEmail}`);
  });

  socket.on('decline-call', async ({ callerEmail }) => {
    const calleeEmail = socket.data.email;
    if (!calleeEmail || !callerEmail) return;

    const call = activeCalls.get(callerEmail);
    if (!call || call.calleeEmail !== calleeEmail) return;

    if (call.timer) {
      clearTimeout(call.timer);
      call.timer = null;
    }

    await updateCallNotification(call.notificationId, {
      callStatus: 'declined',
      message: `Declined by ${calleeEmail.split('@')[0]}`,
    });

    io.to(call.callerSocketId).emit('call-declined', { calleeEmail });
    activeCalls.delete(callerEmail);
    console.log(`[Socket.IO] Call declined: ${calleeEmail} declined from ${callerEmail}`);
  });

  socket.on('end-call', async ({ otherEmail }) => {
    const myEmail = socket.data.email;
    if (!myEmail || !otherEmail) return;

    const call = activeCalls.get(myEmail) || activeCalls.get(otherEmail);
    if (!call) return;

    if (call.timer) {
      clearTimeout(call.timer);
      call.timer = null;
    }

    await updateCallNotification(call.notificationId, {
      callStatus: 'ended',
      read: true,
    });

    const otherSocketId = call.callerEmail === myEmail
      ? call.calleeSocketId
      : call.callerSocketId;

    if (otherSocketId) {
      io.to(otherSocketId).emit('call-ended', { endedBy: myEmail });
    }

    activeCalls.delete(call.callerEmail);
    console.log(`[Socket.IO] Call ended: ${myEmail} ended call with ${otherEmail}`);
  });

  socket.on('offer', ({ to, sdp }) => {
    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('offer', { from: socket.data.email, sdp });
    }
  });

  socket.on('answer', ({ to, sdp }) => {
    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('answer', { from: socket.data.email, sdp });
    }
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('ice-candidate', { from: socket.data.email, candidate });
    }
  });

  socket.on('disconnect', async () => {
    const email = socket.data.email;
    if (email) {
      onlineUsers.delete(email);

      const call = activeCalls.get(email);
      if (call) {
        if (call.timer) {
          clearTimeout(call.timer);
          call.timer = null;
        }

        await updateCallNotification(call.notificationId, {
          callStatus: 'ended',
          read: true,
        });

        const otherSocketId = call.callerEmail === email
          ? call.calleeSocketId
          : call.callerSocketId;

        if (otherSocketId) {
          io.to(otherSocketId).emit('call-ended', { endedBy: email });
        }
        activeCalls.delete(call.callerEmail);
      }

      for (const [callerEmail, call] of activeCalls) {
        if (call.calleeEmail === email) {
          if (call.timer) {
            clearTimeout(call.timer);
            call.timer = null;
          }

          await updateCallNotification(call.notificationId, {
            callStatus: 'missed',
            message: `Missed call - ${callerEmail.split('@')[0]} disconnected`,
          });

          io.to(call.callerSocketId).emit('call-ended', { endedBy: email });
          activeCalls.delete(callerEmail);
        }
      }

      io.emit('user-online', { email, online: false });
      console.log(`[Socket.IO] User disconnected: ${email}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
  console.log(`[Socket.IO] Health check: http://localhost:${PORT}/`);
});
