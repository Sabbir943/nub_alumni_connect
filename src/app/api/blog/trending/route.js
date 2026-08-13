import { NextResponse } from 'next/server';
import { getCollection, serializeId } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const posts = await getCollection('blog_posts');
    const items = await posts.find({}).sort({ createdAt: -1 }).limit(100).toArray();

    const scored = serializeId(items).map((post) => {
      const reactions = post.reactions || {};
      const totalReactions = Object.values(reactions).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0
      );
      return { ...post, totalReactions };
    });

    scored.sort((a, b) => b.totalReactions - a.totalReactions);

    return NextResponse.json({
      success: true,
      posts: scored.slice(0, limit),
    });
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
