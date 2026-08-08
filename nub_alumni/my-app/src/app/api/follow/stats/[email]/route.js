import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('follows');

    const [followersCount, followingCount] = await Promise.all([
      collection.countDocuments({ targetEmail: email }),
      collection.countDocuments({ followerEmail: email })
    ]);

    return NextResponse.json({ followers: followersCount, following: followingCount });
  } catch (error) {
    console.error("Error fetching follow stats:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
