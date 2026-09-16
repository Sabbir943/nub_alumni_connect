import { NextResponse } from 'next/server';
import { getCollection, serializeId } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const featured = searchParams.get('featured');

    const stories = await getCollection('success_stories');
    const query = {};
    if (featured === 'true') {
      query.featured = true;
    }

    const storyList = await stories.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ stories: serializeId(storyList) });
  } catch (error) {
    console.error('Success stories public list error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
