import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const pinned = searchParams.get('pinned');

    const notices = await getCollection('notices');
    const query = {};
    if (pinned === 'true') query.pinned = true;

    const noticeList = await notices.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      notices: noticeList.map(n => ({
        _id: n._id.toString(),
        title: n.title,
        content: n.content,
        priority: n.priority,
        audience: n.audience,
        pinned: n.pinned,
        createdAt: n.createdAt,
      }))
    });
  } catch (error) {
    console.error('Public notices error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
