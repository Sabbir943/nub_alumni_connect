import { NextResponse } from 'next/server';
import { getCollection, ObjectId } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';

export async function PATCH(request, { params }) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid story ID' }, { status: 400 });
    }

    const body = await request.json();
    const stories = await getCollection('success_stories');

    const existing = await stories.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ message: 'Story not found' }, { status: 404 });
    }

    const allowedFields = ['title', 'story', 'achievement', 'category', 'images', 'featured'];
    const updates = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    updates.updatedAt = new Date().toISOString();

    const result = await stories.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'No changes made' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Story updated' });
  } catch (error) {
    console.error('Success story update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid story ID' }, { status: 400 });
    }

    const stories = await getCollection('success_stories');
    const result = await stories.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Story deleted' });
  } catch (error) {
    console.error('Success story delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
