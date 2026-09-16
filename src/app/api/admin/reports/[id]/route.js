import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';

export async function PATCH(request, { params }) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    const { status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ message: 'ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const { ObjectId } = await import('mongodb');
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid report ID' }, { status: 400 });
    }

    const reports = await getCollection('reports');
    const result = await reports.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, resolvedAt: new Date().toISOString() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Report updated' });
  } catch (error) {
    console.error('Update report error:', error);
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
      return NextResponse.json({ message: 'Invalid report ID' }, { status: 400 });
    }

    const reports = await getCollection('reports');
    const result = await reports.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
