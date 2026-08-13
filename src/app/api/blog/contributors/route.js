import { NextResponse } from 'next/server';
import { getCollection, serializeId, findProfileByEmail } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const posts = await getCollection('blog_posts');
    const comments = await getCollection('blog_comments');

    const allPosts = await posts.find({}).toArray();
    const allComments = await comments.find({}).toArray();

    const userStats = {};

    for (const post of allPosts) {
      const email = post.authorEmail;
      if (!userStats[email]) {
        userStats[email] = { email, postCount: 0, commentCount: 0, totalReactions: 0 };
      }
      userStats[email].postCount++;
      const reactions = post.reactions || {};
      userStats[email].totalReactions += Object.values(reactions).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0
      );
    }

    for (const comment of allComments) {
      const email = comment.authorEmail;
      if (!userStats[email]) {
        userStats[email] = { email, postCount: 0, commentCount: 0, totalReactions: 0 };
      }
      userStats[email].commentCount++;
    }

    const ranked = Object.values(userStats).sort(
      (a, b) => (b.postCount + b.commentCount) - (a.postCount + a.commentCount)
    );

    const top = ranked.slice(0, limit);

    const enriched = await Promise.all(
      top.map(async (stat) => {
        const profile = await findProfileByEmail(stat.email);
        return {
          ...stat,
          name: profile?.name || stat.email.split('@')[0],
          avatar: profile?.profilePictureUrl || null,
          score: stat.postCount + stat.commentCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      contributors: enriched,
    });
  } catch (error) {
    console.error('Error fetching contributors:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
