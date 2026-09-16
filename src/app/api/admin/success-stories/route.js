import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const featured = searchParams.get('featured');

    const stories = await getCollection('success_stories');
    const query = {};
    if (featured === 'true') {
      query.featured = true;
    }

    const storyList = await stories.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ stories: storyList.map(s => ({ ...s, _id: s._id.toString() })) });
  } catch (error) {
    console.error('Success stories list error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const body = await request.json();
    const { title, authorName, authorEmail, story, achievement, category, images, featured } = body;

    if (!title || !story) {
      return NextResponse.json({ message: 'Title and story are required' }, { status: 400 });
    }

    const validCategories = ['General', 'Career', 'Startup', 'Academic', 'Leadership', 'Community'];
    const sanitizedCategory = validCategories.includes(category) ? category : 'General';

    const stories = await getCollection('success_stories');
    const newStory = {
      title,
      authorName: authorName || 'Admin',
      authorEmail: authorEmail || '',
      story,
      achievement: achievement || '',
      category: sanitizedCategory,
      images: Array.isArray(images) ? images.slice(0, 4) : [],
      featured: Boolean(featured),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await stories.insertOne(newStory);

    return NextResponse.json({
      message: 'Success story created',
      story: { ...newStory, _id: result.insertedId.toString() },
    }, { status: 201 });
  } catch (error) {
    console.error('Success story create error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
