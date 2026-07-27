import { NextResponse } from 'next/server';
import { getCollection, findProfileByEmail } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { email } = await params;
    const collection = await getCollection('follows');

    const followDocs = await collection
      .find({ targetEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    const followerEmails = followDocs.map((doc) => doc.followerEmail);
    if (followerEmails.length === 0) {
      return NextResponse.json({ followers: [] });
    }

    const profiles = await Promise.all(
      followerEmails.map((e) => findProfileByEmail(e))
    );

    return NextResponse.json({ followers: profiles.filter(Boolean) });
  } catch (error) {
    console.error("Error fetching followers list:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
