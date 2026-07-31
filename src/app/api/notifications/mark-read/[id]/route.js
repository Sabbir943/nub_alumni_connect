import { NextResponse } from 'next/server';
import { getCollection, ObjectId } from '@/lib/mongodb';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const collection = await getCollection('notifications');
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    );
    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
