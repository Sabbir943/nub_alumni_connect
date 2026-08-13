import { NextResponse } from 'next/server';
import { getCollection, serializeId, findProfileByEmail } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const authorEmail = searchParams.get('authorEmail');
    const skip = (page - 1) * limit;

    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    const posts = await getCollection('blog_posts');
    const filter = {};
    if (authorEmail) filter.authorEmail = authorEmail;
    if (category && category !== 'All') filter.category = category;
    if (tag) filter.tags = tag;

    const [items, total] = await Promise.all([
      posts.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      posts.countDocuments(filter),
    ]);

    const userEmail = request.headers.get('x-user-email');
    const serialized = serializeId(items).map((post) => {
      const userReactions = {};
      if (userEmail) {
        for (const [type, emails] of Object.entries(post.reactions || {})) {
          if (Array.isArray(emails) && emails.includes(userEmail)) {
            userReactions[type] = true;
          }
        }
      }
      return { ...post, userReactions };
    });

    return NextResponse.json({
      success: true,
      posts: serialized,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        pageSize: limit,
        hasNext: skip + items.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { authorEmail, text, images, category, tags } = await request.json();

    if (!authorEmail || !text) {
      return NextResponse.json({ success: false, message: 'Author email and text are required.' }, { status: 400 });
    }

    if (images && images.length > 4) {
      return NextResponse.json({ success: false, message: 'Maximum 4 images allowed.' }, { status: 400 });
    }

    const CATEGORIES = ['Career Advice', 'Technology', 'Events', 'General', 'Job Opportunities', 'Academic', 'Networking'];
    const validCategory = CATEGORIES.includes(category) ? category : 'General';
    const validTags = Array.isArray(tags) ? tags.filter((t) => typeof t === 'string' && t.trim()).slice(0, 5) : [];

    const profile = await findProfileByEmail(authorEmail);
    const authorName = profile?.name || authorEmail.split('@')[0];
    const authorAvatar = profile?.profilePictureUrl || null;

    const newPost = {
      authorEmail,
      authorName,
      authorAvatar,
      text,
      images: images || [],
      category: validCategory,
      tags: validTags,
      reactions: { like: [], dislike: [], angry: [], haha: [] },
      commentCount: 0,
      shares: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const collection = await getCollection('blog_posts');
    const result = await collection.insertOne(newPost);

    return NextResponse.json(
      { success: true, message: 'Post created successfully', post: { ...newPost, _id: result.insertedId.toString() } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
