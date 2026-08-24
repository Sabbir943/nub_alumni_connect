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

function isLocalhostOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

// The `cors` package invokes origin functions as (originHeader, callback).
// A plain boolean-returning function never resolves the middleware and hangs
// every Socket.IO handshake, so this MUST be callback-style.
function isOriginAllowed(origin, callback) {
  const allowed =
    !origin ||
    allowedOrigins.includes('*') ||
    allowedOrigins.includes(origin) ||
    isLocalhostOrigin(origin);
  callback(null, allowed);
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

// Create indexes once at startup so message/unread/notification queries stay fast as data grows
let indexesReady = null;

function ensureIndexes() {
  if (!indexesReady) {
    indexesReady = (async () => {
      try {
        const database = await connectDB();
        await Promise.all([
          database.collection('messages').createIndex({ senderEmail: 1, receiverEmail: 1, createdAt: -1 }),
          database.collection('messages').createIndex({ receiverEmail: 1, read: 1 }),
          database.collection('notifications').createIndex({ recipientEmail: 1, read: 1, createdAt: -1 }),
          database.collection('notifications').createIndex({ recipientEmail: 1, type: 1, actorEmail: 1, read: 1 }),
          database.collection('students').createIndex({ email: 1 }),
          database.collection('alumni_directory').createIndex({ email: 1 }),
        ]);
        console.log('[Socket.IO] Database indexes ready');
      } catch (err) {
        indexesReady = null;
        console.error('[Socket.IO] Index creation failed:', err.message);
      }
    })();
  }
  return indexesReady;
}

// HTTP server for health checks
const httpServer = http.createServer((req, res) => {
  console.log('[HTTP]', req.method, req.url);
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
  if (!req.url.startsWith('/socket.io')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  // Let socket.io's engine handle every other path — do NOT respond here.
});

async function createCallNotification({ recipientEmail, callerEmail, callerName, callType }) {
  try {
    const database = await connectDB();
    const notifications = database.collection('notifications');
    const students = database.collection('students');
    const recipientStudent = await students.findOne({ email: recipientEmail });
    const messagingPath = recipientStudent
      ? '/dashboard/students/text-box'
      : '/dashboard/alumni/text';
    const result = await notifications.insertOne({
      recipientEmail,
      type: 'call_incoming',
      actorEmail: callerEmail,
      actorName: callerName,
      callType: callType || 'video',
      message: `${callerName} is calling you (${callType || 'video'})`,
      link: `${messagingPath}?chatWith=${callerEmail}`,
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

const PROFILE_CACHE_TTL = 60000;
const profileCache = new Map(); // email -> { profile, expiresAt }

async function resolveOnlineProfiles(emails) {
  if (!emails || emails.length === 0) return Promise.resolve([]);
  const databaseP = connectDB();
  return Promise.all(
    emails.map(async (email) => {
      const cached = profileCache.get(email);
      if (cached && cached.expiresAt > Date.now()) return cached.profile;

      try {
        const database = await databaseP;
        const students = database.collection('students');
        const alumni = database.collection('alumni_directory');
        const users = database.collection('user');

        // Parallel lookups — previously these ran one after another (3x latency)
        const [student, alumnus, userDoc] = await Promise.all([
          students.findOne({ email }, { projection: { fullName: 1, profilePictureUrl: 1 } }),
          alumni.findOne({ email }, { projection: { name: 1, profilePictureUrl: 1 } }),
          users.findOne({ email }, { projection: { role: 1, name: 1, image: 1 } }),
        ]);

        const name = student?.fullName || alumnus?.name || userDoc?.name || email.split('@')[0];
        const avatar = student?.profilePictureUrl || alumnus?.profilePictureUrl || userDoc?.image || '';
        const role = userDoc?.role || (student ? 'Student' : alumnus ? 'Alumni' : '');

        const profile = { email, name, avatar, role };
        profileCache.set(email, { profile, expiresAt: Date.now() + PROFILE_CACHE_TTL });
        return profile;
      } catch (err) {
        return { email, name: email.split('@')[0], avatar: '', role: '' };
      }
    })
  );
}

// Debounced so a burst of joins/disconnects triggers ONE broadcast instead of many
let broadcastTimer = null;

function broadcastOnlineUsers() {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    (async () => {
      try {
        const users = await resolveOnlineProfiles([...onlineUsers.keys()]);
        io.emit('online-users', users);
      } catch (err) {
        console.error('[Socket.IO] online users broadcast error:', err.message);
      }
    })();
  }, 300);
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

  // ==================== REAL-TIME MESSAGING ====================

  socket.on('send-message', async ({ receiverEmail, text }) => {
    const senderEmail = socket.data.email;
    if (!senderEmail || !receiverEmail || !text) return;

    const trimmedText = text.trim();
    if (trimmedText.length === 0 || trimmedText.length > 2000) return;

    try {
      const database = await connectDB();
      const messages = database.collection('messages');

      const newMessage = {
        senderEmail,
        receiverEmail,
        text: trimmedText,
        read: false,
        createdAt: new Date().toISOString(),
      };

      const result = await messages.insertOne(newMessage);
      const messageWithId = { ...newMessage, _id: result.insertedId.toString() };

      // Emit to recipient's room (all their tabs/devices)
      io.to(receiverEmail).emit('new-message', messageWithId);

      // Also emit back to sender so other tabs of sender get it
      io.to(senderEmail).emit('new-message', messageWithId);

      // Notification is fire-and-forget: message delivery must never wait on it
      (async () => {
        try {
          const students = database.collection('students');
          const alumni = database.collection('alumni_directory');
          const notifications = database.collection('notifications');

          // Parallel lookups — previously up to 4 sequential queries per message
          const [recipientStudent, senderStudent, senderAlumni] = await Promise.all([
            students.findOne({ email: receiverEmail }, { projection: { _id: 1 } }),
            senderEmail === receiverEmail
              ? Promise.resolve(null)
              : students.findOne({ email: senderEmail }, { projection: { fullName: 1 } }),
            senderEmail === receiverEmail
              ? Promise.resolve(null)
              : alumni.findOne({ email: senderEmail }, { projection: { fullName: 1 } }),
          ]);
          const messagingPath = recipientStudent
            ? '/dashboard/students/text-box'
            : '/dashboard/alumni/text';

          const senderName = senderStudent?.fullName || senderAlumni?.fullName || senderEmail.split('@')[0];

          // Only create notification if no recent unread one from this sender
          const recent = await notifications.findOne({
            recipientEmail: receiverEmail,
            type: 'message',
            actorEmail: senderEmail,
            read: false,
          });

          if (!recent) {
            await notifications.insertOne({
              recipientEmail: receiverEmail,
              type: 'message',
              actorEmail: senderEmail,
              actorName: senderName,
              message: `${senderName} sent you a message`,
              link: `${messagingPath}?chatWith=${senderEmail}`,
              read: false,
              createdAt: new Date(),
            });
          }
        } catch (e) {
          console.error('[Socket.IO] Message notification error:', e.message);
        }
      })();

      console.log(`[Socket.IO] Message: ${senderEmail} -> ${receiverEmail}`);
    } catch (err) {
      console.error('[Socket.IO] Failed to send message:', err.message);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  socket.on('typing', ({ to }) => {
    const from = socket.data.email;
    if (!from || !to) return;
    io.to(to).emit('user-typing', { from });
  });

  socket.on('stop-typing', ({ to }) => {
    const from = socket.data.email;
    if (!from || !to) return;
    io.to(to).emit('user-stopped-typing', { from });
  });

  socket.on('mark-read', async ({ from: senderEmail }) => {
    const receiverEmail = socket.data.email;
    if (!receiverEmail || !senderEmail) return;

    try {
      const database = await connectDB();
      const messages = database.collection('messages');
      await messages.updateMany(
        { senderEmail, receiverEmail, read: false },
        { $set: { read: true } }
      );
      // Notify sender that their messages were read
      io.to(senderEmail).emit('messages-read', { by: receiverEmail });
    } catch (err) {
      console.error('[Socket.IO] Mark read error:', err.message);
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
      onlineUsers.delete(email);
      io.emit('user-online', { email, online: false });
      broadcastOnlineUsers();
    }

    console.log(`[Socket.IO] Socket disconnected: ${email} (${socket.id})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
  console.log(`[Socket.IO] Health check: http://localhost:${PORT}/`);
  ensureIndexes();
});