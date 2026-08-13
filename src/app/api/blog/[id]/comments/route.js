import { NextResponse } from 'next/server';
import { getCollection, serializeId, ObjectId } from '@/lib/mongodb';
import { findProfileByEmail } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid post ID.' }, { status: 400 });
    }

    const comments = await getCollection('blog_comments');
    const items = await comments
      .find({ postId: id })
      .sort({ createdAt: -1 })
      .toArray();

    const topLevel = items.filter((c) => !c.parentId);
    const replies = items.filter((c) => c.parentId);

    const threaded = topLevel.map((c) => ({
      ...serializeId(c),
      replies: serializeId(replies.filter((r) => r.parentId === c._id.toString())),
    }));

    return NextResponse.json({
      success: true,
      comments: threaded,
      total: items.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid post ID.' }, { status: 400 });
    }

    const { authorEmail, text, parentId } = await request.json();
    if (!authorEmail || !text) {
      return NextResponse.json({ success: false, message: 'Author email and text are required.' }, { status: 400 });
    }

    const posts = await getCollection('blog_posts');
    const post = await posts.findOne({ _id: new ObjectId(id) });
    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found.' }, { status: 404 });
    }

    const profile = await findProfileByEmail(authorEmail);
    const authorName = profile?.name || authorEmail.split('@')[0];
    const authorAvatar = profile?.avatar || null;

    const newComment = {
      postId: id,
      authorEmail,
      authorName,
      authorAvatar,
      text,
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
    };

    const comments = await getCollection('blog_comments');
    const result = await comments.insertOne(newComment);

    await posts.updateOne({ _id: new ObjectId(id) }, { $inc: { commentCount: 1 } });

    return NextResponse.json(
      { success: true, comment: { ...newComment, _id: result.insertedId.toString() } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
