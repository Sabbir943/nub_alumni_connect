import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';

export async function PATCH(request, { params }) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    const { ObjectId } = await import('mongodb');
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 });
    }

    const events = await getCollection('events');
    const existing = await events.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const allowedFields = ['title', 'description', 'date', 'location', 'type'];
    const updates = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

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
    const { error } = await requireAdmin(request);
    if (error) return error;

    const { id } = await params;

    const { ObjectId } = await import('mongodb');
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 });
    }

    const events = await getCollection('events');
    const result = await events.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
