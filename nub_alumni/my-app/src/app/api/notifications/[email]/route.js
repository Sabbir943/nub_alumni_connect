import { NextResponse } from 'next/server';
import { getCollection, ObjectId } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unread') === 'true';

    const collection = await getCollection('notifications');
    const query = { recipientEmail: email };
    if (type) query.type = type;
    if (unreadOnly) query.read = false;

    const notifications = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const unreadCount = await collection.countDocuments({ recipientEmail: email, read: false });

    return NextResponse.json({
      notifications: notifications.map(n => ({ ...n, _id: n._id.toString() })),
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('notifications');
    await collection.updateMany(
      { recipientEmail: email, read: false },
      { $set: { read: true } }
    );
    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { email } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const collection = await getCollection('notifications');
    if (id) {
      await collection.deleteOne({ _id: new ObjectId(id), recipientEmail: email });
    } else {
      await collection.deleteMany({ recipientEmail: email });
    }
    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
