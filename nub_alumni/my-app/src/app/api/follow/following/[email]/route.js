import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('follows');

    const followDocs = await collection
      .find({ followerEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    const followedEmails = followDocs.map((doc) => doc.targetEmail);
    if (followedEmails.length === 0) {
      return NextResponse.json({ following: [] });
    }

    const profiles = await Promise.all(
      followedEmails.map((e) => findProfileByEmail(e))
    );

    return NextResponse.json({ following: profiles.filter(Boolean) });
  } catch (error) {
    console.error("Error fetching following list:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
