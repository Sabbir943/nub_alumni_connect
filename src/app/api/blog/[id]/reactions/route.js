import { NextResponse } from 'next/server';
import { getCollection, ObjectId } from '@/lib/mongodb';

const VALID_TYPES = ['like', 'dislike', 'angry', 'haha'];

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid post ID.' }, { status: 400 });
    }

    const { email, type } = await request.json();
    if (!email || !type) {
      return NextResponse.json({ success: false, message: 'Email and reaction type are required.' }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ success: false, message: 'Invalid reaction type.' }, { status: 400 });
    }

    const posts = await getCollection('blog_posts');
    const post = await posts.findOne({ _id: new ObjectId(id) });
    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found.' }, { status: 404 });
    }

    const currentReactions = post.reactions || {};
    const typeArray = currentReactions[type] || [];
    const hasReacted = typeArray.includes(email);

    const update = {};
    if (hasReacted) {
      update[`reactions.${type}`] = email;
    } else {
      update[`reactions.${type}`] = email;
    }

    if (hasReacted) {
      await posts.updateOne({ _id: new ObjectId(id) }, { $pull: { [`reactions.${type}`]: email } });
    } else {
      for (const otherType of VALID_TYPES) {
        if (otherType !== type && (currentReactions[otherType] || []).includes(email)) {
          await posts.updateOne({ _id: new ObjectId(id) }, { $pull: { [`reactions.${otherType}`]: email } });
        }
      }
      await posts.updateOne({ _id: new ObjectId(id) }, { $addToSet: { [`reactions.${type}`]: email } });
    }

    const updated = await posts.findOne({ _id: new ObjectId(id) });
    const reactionCounts = {};
    for (const t of VALID_TYPES) {
      reactionCounts[t] = (updated.reactions[t] || []).length;
    }

    const userReactions = {};
    for (const t of VALID_TYPES) {
      if ((updated.reactions[t] || []).includes(email)) {
        userReactions[t] = true;
      }
    }

    return NextResponse.json({ success: true, reactions: reactionCounts, userReactions });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
