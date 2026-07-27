import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user1 = searchParams.get('user1');
    const user2 = searchParams.get('user2');

    if (!user1 || !user2) {
      return NextResponse.json({ success: false, message: "user1 and user2 are required" }, { status: 400 });
    }

    const collection = await getCollection('messages');

    const messages = await collection
      .find({
        $or: [
          { senderEmail: user1, receiverEmail: user2 },
          { senderEmail: user2, receiverEmail: user1 }
        ]
      })
      .sort({ createdAt: 1 })
      .toArray();

    await collection.updateMany(
      { senderEmail: user2, receiverEmail: user1, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
