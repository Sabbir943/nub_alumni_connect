import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pinned = searchParams.get('pinned');

    const notices = await getCollection('notices');
    const query = {};
    if (pinned === 'true') query.pinned = true;

    const noticeList = await notices.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ notices: noticeList.map(n => ({ ...n, _id: n._id.toString() })) });
  } catch (error) {
    console.error('Admin notices error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, content, priority, audience } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ message: 'Title and content are required' }, { status: 400 });
    }

    const notices = await getCollection('notices');
    const notice = {
      title,
      content,
      priority: priority || 'medium',
      audience: audience || 'all',
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await notices.insertOne(notice);
    return NextResponse.json({ message: 'Notice created', noticeId: result.insertedId.toString() });
  } catch (error) {
    console.error('Create notice error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
