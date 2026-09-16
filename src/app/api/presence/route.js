import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail } from '@/lib/mongodb';

const HEARTBEAT_INTERVAL = 30000;
const ONLINE_THRESHOLD = 60000;

export async function GET() {
  try {
    const collection = await getCollection('presence');
    const cutoff = new Date(Date.now() - ONLINE_THRESHOLD);

    collection.deleteMany({ lastSeen: { $lt: cutoff } }).catch(() => {});

    const onlineDocs = await collection
      .find({ lastSeen: { $gte: cutoff } })
      .toArray();

    const emails = onlineDocs.map((d) => d.email);
    if (emails.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const profiles = await Promise.all(emails.map((e) => findProfileByEmail(e)));
    const userCol = await getCollection('user');
    const userDocs = await userCol
      .find({ email: { $in: emails } }, { projection: { email: 1, role: 1, name: 1 } })
      .toArray();
    const userMap = new Map(userDocs.map((u) => [u.email, u]));

    const users = emails.map((email, i) => {
      const profile = profiles[i];
      const userDoc = userMap.get(email);
      return {
        email,
        name: profile?.fullName || userDoc?.name || email.split('@')[0],
        avatar: profile?.profilePictureUrl || userDoc?.image || null,
        role: userDoc?.role || (profile?._source === 'student' ? 'Student' : 'Alumni'),
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching presence:', error);
    return NextResponse.json({ users: [] });
  }
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: 'email is required' }, { status: 400 });
    }

    const collection = await getCollection('presence');
    await collection.updateOne(
      { email },
      { $set: { email, lastSeen: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating presence:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: 'email is required' }, { status: 400 });
    }

    const collection = await getCollection('presence');
    await collection.deleteOne({ email });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error removing presence:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
