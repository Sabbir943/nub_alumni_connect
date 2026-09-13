import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail, serializeId, ObjectId } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const before = searchParams.get('before');

    const groups = await getCollection('group_conversations');
    const group = await groups.findOne({ _id: new ObjectId(id) });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    if (email && !group.participants.some((p) => p.email === email)) {
      return NextResponse.json({ message: 'Not a member of this group' }, { status: 403 });
    }

    const messages = await getCollection('group_messages');
    const query = { groupId: new ObjectId(id) };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const rawMessages = await messages
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const reversed = rawMessages.reverse();

    const messagesWithProfiles = await Promise.all(
      reversed.map(async (msg) => {
        if (msg.type === 'system') return serializeId(msg);
        const profile = await findProfileByEmail(msg.senderEmail);
        return {
          ...serializeId(msg),
          senderName: profile?.fullName || msg.senderEmail.split('@')[0],
          senderAvatar: profile?.profilePictureUrl || null,
        };
      })
    );

    return NextResponse.json({ success: true, messages: messagesWithProfiles });
  } catch (error) {
    console.error('Error fetching group messages:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { senderEmail, text, type = 'text' } = await request.json();

    if (!senderEmail || !text || !text.trim()) {
      return NextResponse.json({ message: 'senderEmail and text are required' }, { status: 400 });
    }

    if (text.trim().length > 2000) {
      return NextResponse.json({ message: 'Message must be under 2000 characters' }, { status: 400 });
    }

    const groups = await getCollection('group_conversations');
    const group = await groups.findOne({ _id: new ObjectId(id) });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    if (!group.participants.some((p) => p.email === senderEmail)) {
      return NextResponse.json({ message: 'Not a member of this group' }, { status: 403 });
    }

    const messages = await getCollection('group_messages');
    const messageDoc = {
      groupId: new ObjectId(id),
      senderEmail,
      text: text.trim(),
      type,
      readBy: [{ email: senderEmail, readAt: new Date() }],
      createdAt: new Date(),
    };

    const result = await messages.insertOne(messageDoc);

    await groups.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastMessage: text.trim().substring(0, 100),
          lastMessageAt: new Date(),
          lastMessageBy: senderEmail,
        },
      }
    );

    const profile = await findProfileByEmail(senderEmail);
    const created = {
      ...serializeId(messageDoc),
      _id: result.insertedId.toString(),
      senderName: profile?.fullName || senderEmail.split('@')[0],
      senderAvatar: profile?.profilePictureUrl || null,
    };

    return NextResponse.json({ success: true, message: created });
  } catch (error) {
    console.error('Error sending group message:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
