import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const { ObjectId } = await import('mongodb');
    const events = await getCollection('events');
    await events.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    return NextResponse.json({ message: 'Event updated' });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { ObjectId } = await import('mongodb');
    const events = await getCollection('events');
    await events.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
