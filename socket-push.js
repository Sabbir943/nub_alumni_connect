const admin = require('firebase-admin');
const { cert } = require('firebase-admin/app');

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Push] Firebase Admin credentials not configured. Push notifications disabled.');
    return;
  }

  try {
    admin.initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    initialized = true;
    console.log('[Push] Firebase Admin initialized');
  } catch (err) {
    console.error('[Push] Firebase Admin init failed:', err.message);
  }
}

async function sendPushToUser(db, email, payload) {
  if (!initialized) return;

  try {
    const tokens = await db.collection('push_tokens').find({ email }).toArray();
    if (tokens.length === 0) return;

    const tokensToDelete = [];
    const messages = tokens.map((t) => ({
      token: t.token,
      notification: payload.title ? { title: payload.title, body: payload.body } : undefined,
      data: {
        ...payload.data,
        url: payload.url || '/',
        type: payload.data?.type || 'notification',
      },
      webpush: {
        notification: {
          title: payload.title || 'NUB Alumni Connect',
          body: payload.body || '',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          image: payload.image,
          data: { url: payload.url || '/' },
        },
      },
      android: {
        priority: 'high',
        notification: {
          title: payload.title || 'NUB Alumni Connect',
          body: payload.body || '',
          clickAction: 'OPEN_ACTIVITY',
          channelId: 'default',
        },
      },
    }));

    const response = await admin.messaging().sendEach(messages);

    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const errorCode = res.error?.code;
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          tokensToDelete.push(tokens[idx].token);
        }
        console.error(`[Push] Send failed for ${tokens[idx].email}:`, errorCode);
      }
    });

    if (tokensToDelete.length > 0) {
      await db.collection('push_tokens').deleteMany({ token: { $in: tokensToDelete } });
    }
  } catch (err) {
    console.error('[Push] Send error:', err.message);
  }
}

module.exports = { initFirebaseAdmin, sendPushToUser };
