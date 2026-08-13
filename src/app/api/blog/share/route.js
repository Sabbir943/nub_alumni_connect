import { NextResponse } from 'next/server';
import { getCollection, ObjectId } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { postId } = await request.json();
    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json({ success: false, message: 'Valid post ID is required.' }, { status: 400 });
    }

    const posts = await getCollection('blog_posts');
    const result = await posts.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { shares: 1 } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Post not found.' }, { status: 404 });
    }

    const post = await posts.findOne({ _id: new ObjectId(postId) });
    return NextResponse.json({ success: true, shares: post.shares });
  } catch (error) {
    console.error('Error sharing post:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
