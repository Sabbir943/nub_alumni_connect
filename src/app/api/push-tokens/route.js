import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ message: 'Email and token are required' }, { status: 400 });
    }

    const collection = await getCollection('push_tokens');

    await collection.updateOne(
      { email, token },
      {
        $set: {
          email,
          token,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Push token saved' });
  } catch (error) {
    console.error('Save push token error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const collection = await getCollection('push_tokens');

    if (token) {
      await collection.deleteOne({ email, token });
    } else {
      await collection.deleteMany({ email });
    }

    return NextResponse.json({ message: 'Push token removed' });
  } catch (error) {
    console.error('Delete push token error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
