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

export async function PATCH(request, { params }) {
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

    const body = await request.json().catch(() => ({}));
    const updates = {};

    if (typeof body.text === 'string') updates.text = body.text;

    const CATEGORY_NAMES = [
      'All', 'General', 'Career Advice', 'Technology', 'Events',
      'Job Opportunities', 'Academic', 'Networking',
    ];
    if (typeof body.category === 'string' && CATEGORY_NAMES.includes(body.category)) {
      updates.category = body.category;
    }

    if (Array.isArray(body.images)) {
      updates.images = body.images.filter((u) => typeof u === 'string').slice(0, 4);
    }

    if (typeof body.videoUrl === 'string') {
      updates.videoUrl = body.videoUrl.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: 'Nothing to update.' }, { status: 400 });
    }

    updates.updatedAt = new Date().toISOString();
    await posts.updateOne({ _id: new ObjectId(id) }, { $set: updates });

    const updated = await posts.findOne({ _id: new ObjectId(id) });
    const serializedPost = serializeId(updated);

    const userReactions = {};
    for (const [type, emails] of Object.entries(updated.reactions || {})) {
      if (Array.isArray(emails) && emails.includes(email)) {
        userReactions[type] = true;
      }
    }
    serializedPost.userReactions = userReactions;

    return NextResponse.json({ success: true, post: serializedPost });
  } catch (error) {
    console.error('Error updating blog post:', error);
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
