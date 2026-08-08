import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const { ObjectId } = await import('mongodb');
    const notices = await getCollection('notices');
    await notices.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date().toISOString() } }
    );

    return NextResponse.json({ message: 'Notice updated' });
  } catch (error) {
    console.error('Update notice error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { ObjectId } = await import('mongodb');
    const notices = await getCollection('notices');
    await notices.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: 'Notice deleted' });
  } catch (error) {
    console.error('Delete notice error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
