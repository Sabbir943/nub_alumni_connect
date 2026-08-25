import { NextResponse } from 'next/server';
import { getCollection, serializeId, ObjectId } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid post ID.' }, { status: 400 });
    }

    const posts = await getCollection('blog_posts');
    const post = await posts.findOne({ _id: new ObjectId(id) });
    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found.' }, { status: 404 });
    }

    const commentsCol = await getCollection('blog_comments');
    const comments = await commentsCol
      .find({ postId: id })
      .sort({ createdAt: -1 })
      .toArray();

    const userEmail = request.headers.get('x-user-email');
    const serializedPost = serializeId(post);
    if (userEmail) {
      const userReactions = {};
      for (const [type, emails] of Object.entries(post.reactions || {})) {
        if (Array.isArray(emails) && emails.includes(userEmail)) {
          userReactions[type] = true;
        }
      }
      serializedPost.userReactions = userReactions;
    }

    return NextResponse.json({
      success: true,
      post: serializedPost,
      comments: serializeId(comments),
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid post ID.' }, { status: 400 });
    }

    const posts = await getCollection('blog_posts');
    const post = await posts.findOne({ _id: new ObjectId(id) });
    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found.' }, { status: 404 });
    }

    const email = request.headers.get('x-user-email');
    if (email !== post.authorEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 403 });
    }

    await posts.deleteOne({ _id: new ObjectId(id) });

    const commentsCol = await getCollection('blog_comments');
    await commentsCol.deleteMany({ postId: id });

    return NextResponse.json({ success: true, message: 'Post deleted.' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
