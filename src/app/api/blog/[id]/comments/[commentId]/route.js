import { NextResponse } from 'next/server';
import { getCollection, ObjectId } from '@/lib/mongodb';

export async function DELETE(request, { params }) {
  try {
    const { id, commentId } = await params;
    if (!ObjectId.isValid(id) || !ObjectId.isValid(commentId)) {
      return NextResponse.json({ success: false, message: 'Invalid ID.' }, { status: 400 });
    }

    const comments = await getCollection('blog_comments');
    const comment = await comments.findOne({ _id: new ObjectId(commentId), postId: id });
    if (!comment) {
      return NextResponse.json({ success: false, message: 'Comment not found.' }, { status: 404 });
    }

    const email = request.headers.get('x-user-email');
    if (email !== comment.authorEmail) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 403 });
    }

    await comments.deleteOne({ _id: new ObjectId(commentId) });

    const posts = await getCollection('blog_posts');
    await posts.updateOne({ _id: new ObjectId(id) }, { $inc: { commentCount: -1 } });

    return NextResponse.json({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
