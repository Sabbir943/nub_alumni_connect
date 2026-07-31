import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    const reports = await getCollection('reports');
    const query = {};
    if (status) query.status = status;

    const reportList = await reports.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ reports: reportList.map(r => ({ ...r, _id: r._id.toString() })) });
  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { reporterEmail, targetType, targetId, reason, description } = await request.json();

    if (!reporterEmail || !targetType || !targetId || !reason) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const reports = await getCollection('reports');
    const report = {
      reporterEmail,
      targetType,
      targetId,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const result = await reports.insertOne(report);
    return NextResponse.json({ message: 'Report submitted', reportId: result.insertedId.toString() });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
