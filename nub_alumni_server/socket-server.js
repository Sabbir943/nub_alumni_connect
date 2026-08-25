const { Server } = require('socket.io');
const { MongoClient, ObjectId } = require('mongodb');
const http = require('http');

const PORT = process.env.SOCKET_PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'nub_alumni';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const allowedOrigins = CORS_ORIGIN === '*'
  ? ['*']
  : CORS_ORIGIN.split(',').map((o) => o.trim());

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
  } catch {
    // ignore malformed origins
  }
  return false;
}

// Cache the database connection promise to avoid multiple simultaneous connection pools
let dbPromise = null;

async function connectDB() {
  if (!dbPromise) {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }
    dbPromise = MongoClient.connect(MONGODB_URI).then((client) => client.db(DB_NAME));
  }
  return dbPromise;
}

// HTTP server for health checks
const httpServer = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'socket-server' }));
    return;
  }
  if (req.url === '/online-users') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users: [...onlineUsers.keys()] }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'not found' }));
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
    origin: isOriginAllowed,
    methods: ['GET', 'POST'],
  },
});

httpServer.on('clientError', (err, socket) => {
  if (err && socket && !socket.destroyed) socket.destroy();
});
process.on('uncaughtException', (err) => {
  console.error('[Socket.IO] Uncaught exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Socket.IO] Unhandled rejection:', reason);
});

const activeCalls = new Map();
const onlineUsers = new Map(); // email -> active socket count (multi-tab safe)

async function resolveOnlineProfiles(emails) {
  if (!emails || emails.length === 0) return [];
  const database = await connectDB();
  const students = database.collection('students');
  const alumni = database.collection('alumni_directory');
  const users = database.collection('user');

  const resolved = [];
  for (const email of emails) {
    try {
      const student = await students.findOne({ email }, { projection: { fullName: 1, profilePictureUrl: 1 } });
      const alumnus = student ? null : await alumni.findOne({ email }, { projection: { name: 1, profilePictureUrl: 1 } });
      const userDoc = await users.findOne({ email }, { projection: { role: 1, name: 1, image: 1 } });

      const name = student?.fullName || alumnus?.name || userDoc?.name || email.split('@')[0];
      const avatar = student?.profilePictureUrl || alumnus?.profilePictureUrl || userDoc?.image || '';
      const role = userDoc?.role || (student ? 'Student' : alumnus ? 'Alumni' : '');

      resolved.push({ email, name, avatar, role });
    } catch (err) {
      resolved.push({ email, name: email.split('@')[0], avatar: '', role: '' });
    }
  }
  return resolved;
}

function broadcastOnlineUsers() {
  (async () => {
    try {
      const users = await resolveOnlineProfiles([...onlineUsers.keys()]);
      io.emit('online-users', users);
    } catch (err) {
      console.error('[Socket.IO] online users broadcast error:', err.message);
    }
  })();
}

io.on('connection', (socket) => {
  console.log('[Socket.IO] User connected:', socket.id);
  socket.on('error', (err) => {
    console.error('[Socket.IO] Socket error:', err.message);
  });

  // Use Socket.IO rooms for user identification (Supports multi-tab naturally)
  socket.on('join', (email) => {
    if (!email) return;
    socket.data.email = email;
    socket.join(email);
    console.log(`[Socket.IO] User joined room: ${email} (${socket.id})`);
    
    // Track online user and broadcast updated list
    onlineUsers.set(email, (onlineUsers.get(email) || 0) + 1);
    io.emit('user-online', { email, online: true });
    broadcastOnlineUsers();
  });

  socket.on('call-user', async ({ calleeEmail, callType }) => {
    const callerEmail = socket.data.email;
    if (!callerEmail || !calleeEmail) return;

    // Check if callee is connected to their room
    const calleeRoom = io.sockets.adapter.rooms.get(calleeEmail);
    if (!calleeRoom || calleeRoom.size === 0) {
      socket.emit('call-failed', { reason: 'User is offline' });
      return;
    }

    // Prevent duplicate calls
    for (const [, call] of activeCalls) {
      if (call.calleeEmail === calleeEmail || call.callerEmail === calleeEmail) {
        socket.emit('call-failed', { reason: 'User is already in a call' });
        return;
      }
      if (call.callerEmail === callerEmail || call.calleeEmail === callerEmail) {
        socket.emit('call-failed', { reason: 'You are already in a call' });
        return;
      }
    }

    const callerName = callerEmail.split('@')[0];
    const notificationId = await createCallNotification({
      recipientEmail: calleeEmail,
      callerEmail,
      callerName,
      callType,
    });

    const callData = {
      callerSocketId: socket.id,
      callerEmail,
      calleeEmail,
      callType,
      notificationId,
      answered: false,
      timer: null,
    };

    // 30-Second Missed Call Timeout
    callData.timer = setTimeout(async () => {
      const call = activeCalls.get(callerEmail);
      if (call && !call.answered) {
        await updateCallNotification(call.notificationId, {
          callStatus: 'missed',
          message: `Missed call from ${callerName}`,
        });

        io.to(call.callerSocketId).emit('call-failed', { reason: 'No answer' });
        io.to(calleeEmail).emit('call-missed', { callerEmail });
        activeCalls.delete(callerEmail);
        console.log(`[Socket.IO] Call missed: ${callerEmail} -> ${calleeEmail}`);
      }
    }, 30000);

    activeCalls.set(callerEmail, callData);

    // Send call alert to all active tabs/devices of the callee
    io.to(calleeEmail).emit('incoming-call', {
      callerEmail,
      callerName,
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
    call.calleeSocketId = socket.id; // Lock the active receiving socket ID

    await updateCallNotification(call.notificationId, {
      callStatus: 'answered',
      read: true,
    });

    io.to(call.callerSocketId).emit('call-answered', { calleeEmail });
    console.log(`[Socket.IO] Call answered: ${calleeEmail} accepted call from ${callerEmail}`);
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
    console.log(`[Socket.IO] Call declined: ${calleeEmail} declined call from ${callerEmail}`);
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

    // Notify the other peer's room
    io.to(otherEmail).emit('call-ended', { endedBy: myEmail });

    activeCalls.delete(call.callerEmail);
    console.log(`[Socket.IO] Call ended: ${myEmail} ended call with ${otherEmail}`);
  });

  // Peer-to-Peer WebRTC Signaling Relays
  socket.on('offer', ({ to, sdp }) => {
    if (to) {
      io.to(to).emit('offer', { from: socket.data.email, sdp });
    }
  });

  socket.on('answer', ({ to, sdp }) => {
    if (to) {
      io.to(to).emit('answer', { from: socket.data.email, sdp });
    }
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    if (to) {
      io.to(to).emit('ice-candidate', { from: socket.data.email, candidate });
    }
  });

  socket.on('disconnect', async () => {
    const email = socket.data.email;
    if (!email) return;

    // If caller disconnects during active/ringing call
    const callAsCaller = activeCalls.get(email);
    if (callAsCaller) {
      if (callAsCaller.timer) clearTimeout(callAsCaller.timer);

      await updateCallNotification(callAsCaller.notificationId, {
        callStatus: 'ended',
        read: true,
      });

      io.to(callAsCaller.calleeEmail).emit('call-ended', { endedBy: email });
      activeCalls.delete(email);
    }

    // If callee disconnects during active/ringing call
    for (const [callerEmail, call] of activeCalls) {
      if (call.calleeEmail === email) {
        if (call.timer) clearTimeout(call.timer);

        await updateCallNotification(call.notificationId, {
          callStatus: 'missed',
          message: `Missed call - recipient disconnected`,
        });

        io.to(call.callerSocketId).emit('call-ended', { endedBy: email });
        activeCalls.delete(callerEmail);
      }
    }

    // Check if user has any remaining active tab sockets connected
    const remainingSockets = io.sockets.adapter.rooms.get(email);
    if (!remainingSockets || remainingSockets.size === 0) {
      const count = (onlineUsers.get(email) || 1) - 1;
      if (count <= 0) onlineUsers.delete(email);
      else onlineUsers.set(email, count);
      io.emit('user-online', { email, online: false });
      broadcastOnlineUsers();
    }

    console.log(`[Socket.IO] Socket disconnected: ${email} (${socket.id})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
  console.log(`[Socket.IO] Health check: http://localhost:${PORT}/`);
});