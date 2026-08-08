import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const followerEmail = searchParams.get('followerEmail');
    const targetEmail = searchParams.get('targetEmail');

    const collection = await getCollection('follows');
    const follow = await collection.findOne({ followerEmail, targetEmail });
    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
