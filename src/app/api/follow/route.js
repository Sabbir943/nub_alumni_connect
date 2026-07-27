import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { followerEmail, targetEmail } = await request.json();
    if (!followerEmail || !targetEmail) {
      return NextResponse.json({ message: "followerEmail and targetEmail are required" }, { status: 400 });
    }

    const collection = await getCollection('follows');
    const existing = await collection.findOne({ followerEmail, targetEmail });
    if (existing) {
      return NextResponse.json({ message: "Already following" }, { status: 409 });
    }

    await collection.insertOne({ followerEmail, targetEmail, createdAt: new Date() });
    return NextResponse.json({ message: "Followed successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error following:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { followerEmail, targetEmail } = await request.json();
    const collection = await getCollection('follows');
    await collection.deleteOne({ followerEmail, targetEmail });
    return NextResponse.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
