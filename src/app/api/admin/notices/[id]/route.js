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
      return NextResponse.json({ message: 'Invalid notice ID' }, { status: 400 });
    }

    const notices = await getCollection('notices');
    const existing = await notices.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ message: 'Notice not found' }, { status: 404 });
    }

    const allowedFields = ['title', 'content', 'priority', 'audience', 'pinned'];
    const updates = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    updates.updatedAt = new Date().toISOString();

    await notices.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    return NextResponse.json({ message: 'Notice updated' });
  } catch (error) {
    console.error('Update notice error:', error);
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
      return NextResponse.json({ message: 'Invalid notice ID' }, { status: 400 });
    }

    const notices = await getCollection('notices');
    const result = await notices.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Notice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notice deleted' });
  } catch (error) {
    console.error('Delete notice error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
