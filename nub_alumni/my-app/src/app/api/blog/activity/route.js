import { NextResponse } from 'next/server';
import { getCollection, serializeId } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const comments = await getCollection('blog_comments');
    const posts = await getCollection('blog_posts');

    const recentComments = await comments
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit * 2)
      .toArray();

    const serialized = serializeId(recentComments);

    const enriched = await Promise.all(
      serialized.map(async (comment) => {
        let postTitle = '';
        let postAuthor = '';
        if (comment.postId) {
          try {
            const { ObjectId } = await import('mongodb');
            if (ObjectId.isValid(comment.postId)) {
              const post = await posts.findOne({ _id: new ObjectId(comment.postId) });
              if (post) {
                postTitle = post.text?.substring(0, 80) || '';
                postAuthor = post.authorName || '';
              }
            }
          } catch {}
        }
        return {
          ...comment,
          postTitle,
          postAuthor,
        };
      })
    );

    return NextResponse.json({
      success: true,
      activity: enriched.slice(0, limit),
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
