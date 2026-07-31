import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ message: 'ID and status are required' }, { status: 400 });
    }

    const { ObjectId } = await import('mongodb');
    const reports = await getCollection('reports');
    await reports.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, resolvedAt: new Date().toISOString() } }
    );

    return NextResponse.json({ message: 'Report updated' });
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { ObjectId } = await import('mongodb');
    const reports = await getCollection('reports');
    await reports.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
