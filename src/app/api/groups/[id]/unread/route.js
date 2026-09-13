import { NextResponse } from 'next/server';
import { getCollection, ObjectId } from '@/lib/mongodb';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { email, after } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'email is required' }, { status: 400 });
    }

    const groups = await getCollection('group_conversations');
    const group = await groups.findOne({ _id: new ObjectId(id) });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    if (!group.participants.some((p) => p.email === email)) {
      return NextResponse.json({ message: 'Not a member of this group' }, { status: 403 });
    }

    const messages = await getCollection('group_messages');
    const query = {
      groupId: new ObjectId(id),
      senderEmail: { $ne: email },
      'readBy.email': { $ne: email },
    };
    if (after) {
      query.createdAt = { $gte: new Date(after) };
    }

    await messages.updateMany(query, {
      $push: { readBy: { email, readAt: new Date() } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking group messages as read:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
